import { StrictMode } from "react";
import {
  act,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import { ColorModeProvider } from "./context/ColorModeContext.tsx";
import type { ChatMessage } from "./types/chat.ts";

interface OutgoingSocketMessage {
  to: number;
  message: string;
}

class TestWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: TestWebSocket[] = [];

  readyState = TestWebSocket.CONNECTING;
  readonly sentMessages: OutgoingSocketMessage[] = [];
  readonly url: string;

  constructor(url: string | URL) {
    super();
    this.url = String(url);
    TestWebSocket.instances.push(this);
    queueMicrotask(() => {
      if (this.readyState === TestWebSocket.CONNECTING) {
        this.readyState = TestWebSocket.OPEN;
        this.dispatchEvent(new Event("open"));
      }
    });
  }

  send(data: string): void {
    this.sentMessages.push(JSON.parse(data) as OutgoingSocketMessage);
  }

  close(): void {
    this.readyState = TestWebSocket.CLOSED;
    this.dispatchEvent(new Event("close"));
  }

  receive(payload: unknown): void {
    this.dispatchEvent(
      new MessageEvent("message", { data: JSON.stringify(payload) }),
    );
  }
}

function renderApp() {
  return render(
    <StrictMode>
      <ColorModeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ColorModeProvider>
    </StrictMode>,
  );
}

describe("chat application", () => {
  let serverHistory: ChatMessage[];
  let requests: { path: string; method: string; body: unknown; auth: string | null }[];

  beforeEach(() => {
    serverHistory = [];
    requests = [];
    window.localStorage.clear();
    TestWebSocket.instances = [];
    vi.stubGlobal("WebSocket", TestWebSocket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
          window.location.href,
        );
        const body = init?.body
          ? (JSON.parse(String(init.body)) as unknown)
          : null;
        const headers = new Headers(init?.headers);
        requests.push({
          path: url.pathname,
          method: init?.method ?? "GET",
          body,
          auth: headers.get("Authorization"),
        });

        let status = 200;
        let response: unknown;
        if (url.pathname === "/login") {
          const credentials = body as { username: string; password: string };
          if (credentials.username === "invalid") {
            status = 401;
            response = { detail: "Invalid username or password" };
          } else {
            response = {
              access_token: "test-access-token",
              token_type: "bearer",
              user_id: 1,
            };
          }
        } else if (url.pathname === "/register") {
          const credentials = body as { username: string };
          response = { id: 3, username: credentials.username };
        } else if (url.pathname === "/users") {
          response = [
            { id: 1, username: "alice" },
            { id: 2, username: "bob" },
          ];
        } else if (url.pathname === "/online-users") {
          response = { online_user_ids: [2] };
        } else if (url.pathname === "/messages/1/2") {
          response = serverHistory;
        } else {
          status = 404;
          response = { detail: "Not found" };
        }

        return new Response(JSON.stringify(response), {
          status,
          headers: { "Content-Type": "application/json" },
        });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows login errors and registers without sending credentials as auth", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.type(screen.getByRole("textbox", { name: "Username" }), "invalid");
    await user.type(
      screen.getByLabelText(/Password/),
      "wrong-password",
    );
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText(/Password/)).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText(/Password/)).toHaveAttribute(
      "type",
      "password",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid username or password",
    );

    await user.click(
      screen.getByRole("button", { name: "Need an account? Create one" }),
    );
    await user.clear(screen.getByRole("textbox", { name: "Username" }));
    await user.type(screen.getByRole("textbox", { name: "Username" }), "new-user");
    await user.clear(screen.getByLabelText(/Password/));
    await user.type(
      screen.getByLabelText(/Password/),
      "new-password",
    );
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(
      await screen.findByText(
        "Account created. Sign in with your new credentials.",
      ),
    ).toBeInTheDocument();
    expect(
      requests.find((request) => request.path === "/register"),
    ).toMatchObject({
      method: "POST",
      body: { username: "new-user", password: "new-password" },
      auth: null,
    });
  });

  it("loads contacts and history, sends optimistically, and reconciles the server history", async () => {
    const user = userEvent.setup();
    const { container } = renderApp();

    await user.type(screen.getByRole("textbox", { name: "Username" }), "alice");
    await user.type(
      screen.getByLabelText(/Password/),
      "correct-password",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const bobContact = await screen.findByRole("button", { name: /bob Online/ });
    expect(screen.queryByText("alice", { exact: true })).not.toBeInTheDocument();
    expect(
      requests.some(
        (request) =>
          request.path === "/users" &&
          request.auth === "Bearer test-access-token",
      ),
    ).toBe(true);

    await user.click(bobContact);
    expect(
      await screen.findByText("No messages in this conversation yet."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Real-time connection is active."),
    ).not.toBeInTheDocument();

    const socket = TestWebSocket.instances.at(-1);
    expect(socket).toBeDefined();
    expect(new URL(socket!.url).searchParams.get("token")).toBe(
      "test-access-token",
    );

    const composer = screen.getByRole("textbox", { name: "Message" });
    await user.type(composer, "draft line");
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    expect(composer).toHaveValue("draft line\n");
    await user.clear(composer);
    await user.type(composer, "hello Bob");
    await user.keyboard("{Enter}");

    expect(await screen.findByText("hello Bob")).toBeInTheDocument();
    expect(socket!.sentMessages).toEqual([{ to: 2, message: "hello Bob" }]);
    expect(
      await screen.findByRole("img", { name: /awaiting history sync/ }),
    ).toBeInTheDocument();

    const optimisticTimestamp = container
      .querySelector("time")
      ?.getAttribute("datetime");
    expect(optimisticTimestamp).toBeTruthy();
    serverHistory = [
      {
        id: 11,
        sender_id: 1,
        receiver_id: 2,
        content: "hello Bob",
        sent_at: optimisticTimestamp!,
      },
    ];
    act(() => {
      socket!.receive({
        info: "The message is saved, but was not delivered live.",
      });
    });

    expect(
      await screen.findByRole("status"),
    ).toHaveTextContent("The message is saved, but was not delivered live.");
    await waitFor(() => {
      expect(
        screen.queryByRole("img", { name: /awaiting history sync/ }),
      ).not.toBeInTheDocument();
    });
    expect(screen.getAllByText("hello Bob")).toHaveLength(1);

    act(() => {
      socket!.receive({
        id: 12,
        from: 2,
        message: "<img src=x onerror=alert(1)>",
        sent_at: "2026-10-16T12:01:00Z",
      });
    });
    expect(
      await screen.findByText("<img src=x onerror=alert(1)>"),
    ).toBeInTheDocument();
    expect(container.querySelector('img[src="x"]')).toBeNull();

    act(() => {
      socket!.readyState = TestWebSocket.CLOSED;
      socket!.dispatchEvent(new Event("close"));
    });
    expect(
      await screen.findByRole("button", { name: "Reconnect" }),
    ).toBeEnabled();
    await user.type(composer, "keep as draft");
    expect(composer).toHaveValue("keep as draft");
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
    expect(socket!.sentMessages).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Reconnect" }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Send message" })).toBeEnabled();
    });
    expect(screen.queryByText("Real-time connection is active.")).not.toBeInTheDocument();
    expect(
      TestWebSocket.instances.flatMap((instance) => instance.sentMessages),
    ).toEqual([{ to: 2, message: "hello Bob" }]);
    expect(composer).toHaveValue("keep as draft");

    await user.click(screen.getByRole("button", { name: "More options" }));
    await user.click(screen.getByRole("menuitem", { name: /Sign out/ }));
    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
  });

  it("retries conversation history after a permission error", async () => {
    const user = userEvent.setup();
    let rejectHistory = true;
    const nativeFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
          window.location.href,
        );
        if (url.pathname === "/messages/1/2" && rejectHistory) {
          return new Response(
            JSON.stringify({ detail: "You can only fetch your own chat history" }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }
        return (nativeFetch as typeof fetch)(input, init);
      }),
    );
    renderApp();

    await user.type(screen.getByRole("textbox", { name: "Username" }), "alice");
    await user.type(
      screen.getByLabelText(/Password/),
      "correct-password",
    );
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    const search = await screen.findByRole("textbox", {
      name: "Search contacts",
    });
    await user.type(search, "not-a-contact");
    expect(
      await screen.findByText("No contacts match your search."),
    ).toBeInTheDocument();
    await user.clear(search);
    expect(
      await screen.findByRole("button", { name: /bob Online/ }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Switch to dark mode" }));
    expect(window.localStorage.getItem("web-chat-color-mode")).toBe("dark");
    await user.click(screen.getByRole("button", { name: "More options" }));
    expect(screen.getByRole("menuitem", { name: /Sign out/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menuitem", { name: /Sign out/ })).toBeNull();
    await user.click(
      await screen.findByRole("button", { name: /bob Online/ }),
    );
    expect(
      await screen.findByText("You can only fetch your own chat history"),
    ).toBeInTheDocument();

    rejectHistory = false;
    await user.click(
      screen.getByRole("button", { name: "Retry loading history" }),
    );
    expect(
      await screen.findByText("No messages in this conversation yet."),
    ).toBeInTheDocument();
    const conversation = within(
      screen.getByRole("region", { name: "Conversation with bob" }),
    );
    await user.click(
      conversation.getByRole("button", { name: "Conversation options" }),
    );
    expect(
      screen.getByRole("menuitem", { name: /Refresh history/ }),
    ).toBeEnabled();
    await user.click(screen.getByRole("menuitem", { name: /Refresh history/ }));
    expect(
      await screen.findByText("No messages in this conversation yet."),
    ).toBeInTheDocument();
  });

  it("returns to login when a protected request reports an expired token", async () => {
    const user = userEvent.setup();
    let expireSession = false;
    const nativeFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url,
          window.location.href,
        );
        if (url.pathname === "/users" && expireSession) {
          return new Response(
            JSON.stringify({ detail: "Invalid authentication token" }),
            { status: 401, headers: { "Content-Type": "application/json" } },
          );
        }
        return (nativeFetch as typeof fetch)(input, init);
      }),
    );
    renderApp();

    await user.type(screen.getByRole("textbox", { name: "Username" }), "alice");
    await user.type(screen.getByLabelText(/Password/), "correct-password");
    expireSession = true;
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(
      await screen.findByRole("heading", { name: "Welcome back" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });
});
