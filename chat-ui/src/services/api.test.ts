import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiConfigurationError,
  ApiContractError,
  buildWebSocketUrl,
  getMessageHistory,
  getOnlineUsers,
  listUsers,
  login,
  registerUser,
} from "./api.ts";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("backend API client", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts registration and login credentials without an authorization header", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ id: 4, username: "alice" }))
      .mockResolvedValueOnce(
        jsonResponse({
          access_token: "opaque-token",
          token_type: "bearer",
          user_id: 4,
        }),
      );

    await expect(
      registerUser({ username: "alice", password: "secret" }),
    ).resolves.toEqual({ id: 4, username: "alice" });
    await expect(
      login({ username: "alice", password: "secret" }),
    ).resolves.toEqual({
      access_token: "opaque-token",
      token_type: "bearer",
      user_id: 4,
    });

    for (const [url, init] of fetchMock.mock.calls) {
      const request = init as RequestInit;
      expect(new URL(String(url)).pathname).toMatch(/\/(register|login)$/);
      expect(request.method).toBe("POST");
      expect(new Headers(request.headers).has("Authorization")).toBe(false);
      expect(JSON.parse(String(request.body))).toEqual({
        username: "alice",
        password: "secret",
      });
    }
  });

  it("sends Bearer tokens and parses users, presence, and message history", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ id: 2, username: "bob" }]))
      .mockResolvedValueOnce(jsonResponse({ online_user_ids: [2] }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 9,
            sender_id: 1,
            receiver_id: 2,
            content: "hello",
            sent_at: "2026-10-16T12:00:00Z",
          },
        ]),
      );

    await expect(listUsers("opaque-token")).resolves.toEqual([
      { id: 2, username: "bob" },
    ]);
    await expect(getOnlineUsers("opaque-token")).resolves.toEqual([2]);
    await expect(getMessageHistory("opaque-token", 1, 2)).resolves.toEqual([
      {
        id: 9,
        sender_id: 1,
        receiver_id: 2,
        content: "hello",
        sent_at: "2026-10-16T12:00:00Z",
      },
    ]);

    const requests = fetchMock.mock.calls.map(([url, init]) => ({
      path: new URL(String(url)).pathname,
      authorization: new Headers((init as RequestInit).headers).get(
        "Authorization",
      ),
    }));
    expect(requests).toEqual([
      { path: "/users", authorization: "Bearer opaque-token" },
      { path: "/online-users", authorization: "Bearer opaque-token" },
      { path: "/messages/1/2", authorization: "Bearer opaque-token" },
    ]);
  });

  it("normalizes FastAPI 401 and 422 detail errors", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ detail: "Invalid username or password" }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          {
            detail: [
              {
                type: "missing",
                loc: ["body", "password"],
                msg: "Field required",
              },
            ],
          },
          422,
        ),
      );

    await expect(login({ username: "alice", password: "wrong" })).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Invalid username or password",
    });
    await expect(
      registerUser({ username: "alice", password: "secret" }),
    ).rejects.toMatchObject({
      status: 422,
      message: "password: Field required",
    });
  });

  it("rejects malformed success responses and invalid dates", async () => {
    fetchMock
      .mockResolvedValueOnce(new Response("not-json"))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 1,
            sender_id: 1,
            receiver_id: 2,
            content: "message",
            sent_at: "not-a-date",
          },
        ]),
      );

    await expect(listUsers("opaque-token")).rejects.toBeInstanceOf(
      ApiContractError,
    );
    await expect(getMessageHistory("opaque-token", 1, 2)).rejects.toBeInstanceOf(
      ApiContractError,
    );
  });

  it("builds the authenticated WebSocket URL without exposing it in errors", () => {
    const url = new URL(buildWebSocketUrl("token with spaces"));

    expect(url.protocol).toBe("wss:");
    expect(url.pathname).toBe("/ws");
    expect(url.searchParams.get("token")).toBe("token with spaces");
  });

  it("uses a generic message when an error detail array is empty", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ detail: [] }, 400));

    await expect(login({ username: "alice", password: "secret" })).rejects.toMatchObject({
      status: 400,
      message: "The chat service returned an error (400).",
    });
  });

  it("rejects empty access tokens before making a request", async () => {
    await expect(listUsers("  ")).rejects.toBeInstanceOf(
      ApiConfigurationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
