// src/lib/crypto.ts
// Cloudflare Workers compatible password hashing and JWT
// Uses Web Crypto API — no external dependencies needed

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const KEY_LENGTH = 32;

// ─── Password Hashing ────────────────────────────────────────────────────────

function bufToHex(buf: ArrayBuffer): string {
	return Array.from(new Uint8Array(buf))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function hexToBuf(hex: string): Uint8Array {
	const arr = new Uint8Array(hex.length / 2);

	for (let i = 0; i < hex.length; i += 2) {
		arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
	}

	return arr;
}

export async function hashPassword(password: string): Promise<string> {
	// Use a real ArrayBuffer so Web Crypto accepts the salt
	// without ArrayBufferLike / SharedArrayBuffer type conflicts.
	const saltBuffer = new ArrayBuffer(SALT_LENGTH);
	const salt = new Uint8Array(saltBuffer);
	crypto.getRandomValues(salt);

	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const derived = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt: saltBuffer,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		KEY_LENGTH * 8
	);

	return `pbkdf2$${PBKDF2_ITERATIONS}$${bufToHex(
		saltBuffer
	)}$${bufToHex(derived)}`;
}

export async function verifyPassword(
	password: string,
	stored: string
): Promise<boolean> {
	try {
		const [, iterStr, saltHex, hashHex] = stored.split("$");

		const iterations = parseInt(iterStr ?? "100000", 10);

		const saltBytes = hexToBuf(saltHex ?? "");

		// Copy into a guaranteed ArrayBuffer.
		const saltBuffer = new ArrayBuffer(saltBytes.byteLength);
		new Uint8Array(saltBuffer).set(saltBytes);

		const keyMaterial = await crypto.subtle.importKey(
			"raw",
			new TextEncoder().encode(password),
			"PBKDF2",
			false,
			["deriveBits"]
		);

		const derived = await crypto.subtle.deriveBits(
			{
				name: "PBKDF2",
				salt: saltBuffer,
				iterations,
				hash: "SHA-256",
			},
			keyMaterial,
			KEY_LENGTH * 8
		);

		return bufToHex(derived) === hashHex;
	} catch {
		return false;
	}
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface JWTPayload {
	sub: string;
	email: string;
	role: string;
	iat: number;
	exp: number;
}

function base64url(data: string | ArrayBuffer): string {
	const bytes =
		typeof data === "string"
			? new TextEncoder().encode(data)
			: new Uint8Array(data);

	let str = "";

	for (const b of bytes) {
		str += String.fromCharCode(b);
	}

	return btoa(str)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function base64urlDecode(str: string): string {
	const padded = str.replace(/-/g, "+").replace(/_/g, "/");
	const pad = padded.length % 4;
	const padded2 = pad
		? padded + "=".repeat(4 - pad)
		: padded;

	return atob(padded2);
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
	return crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"]
	);
}

export async function signJWT(
	payload: Omit<JWTPayload, "iat" | "exp">,
	secret: string,
	expiresInSeconds = 86_400
): Promise<string> {
	const now = Math.floor(Date.now() / 1000);

	const fullPayload: JWTPayload = {
		...payload,
		iat: now,
		exp: now + expiresInSeconds,
	};

	const header = base64url(
		JSON.stringify({
			alg: "HS256",
			typ: "JWT",
		})
	);

	const body = base64url(JSON.stringify(fullPayload));

	const signingInput = `${header}.${body}`;

	const key = await getSigningKey(secret);

	const signature = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(signingInput)
	);

	return `${signingInput}.${base64url(signature)}`;
}

export async function verifyJWT(
	token: string,
	secret: string
): Promise<JWTPayload | null> {
	try {
		const parts = token.split(".");

		if (parts.length !== 3) {
			return null;
		}

		const [header, body, sig] = parts as [
			string,
			string,
			string
		];

		const signingInput = `${header}.${body}`;

		const key = await getSigningKey(secret);

		const sigPadded = sig
			.replace(/-/g, "+")
			.replace(/_/g, "/");

		const sigBytes = Uint8Array.from(
			atob(sigPadded),
			(c) => c.charCodeAt(0)
		);

		// Copy signature into a guaranteed ArrayBuffer.
		const sigBuffer = new ArrayBuffer(sigBytes.byteLength);
		new Uint8Array(sigBuffer).set(sigBytes);

		const signingData = new TextEncoder().encode(
			signingInput
		);

		const signingBuffer = new ArrayBuffer(
			signingData.byteLength
		);
		new Uint8Array(signingBuffer).set(signingData);

		const valid = await crypto.subtle.verify(
			"HMAC",
			key,
			sigBuffer,
			signingBuffer
		);

		if (!valid) {
			return null;
		}

		const payload = JSON.parse(
			base64urlDecode(body)
		) as JWTPayload;

		const now = Math.floor(Date.now() / 1000);

		if (payload.exp < now) {
			return null;
		}

		return payload;
	} catch {
		return null;
	}
}