"use client";

import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useState } from "react";

type MiniAppUser = Awaited<typeof sdk.context>["user"];

export default function Home() {
  const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(null);
  const [user, setUser] = useState<MiniAppUser | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        sdk.actions.ready();
        const inMiniApp = await sdk.isInMiniApp();
        if (!isMounted) return;

        setIsInMiniApp(inMiniApp);
        if (inMiniApp) {
          const context = await sdk.context;
          if (!isMounted) return;
          setUser(context.user ?? null);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Mini-app init failed.");
      }
    };

    init();
    return () => {
      isMounted = false;
    };
  }, []);

  if (isInMiniApp === null) {
    return (
      <main className="page">
        <div className="card">
          <p className="badge">Loading mini-app…</p>
        </div>
      </main>
    );
  }

  if (!isInMiniApp) {
    return (
      <main className="page">
        <div className="card">
          <p className="badge">Please launch it on the base app</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card">
        <p className="badge">Base Mini-App Template</p>
        <h1>Start Building</h1>
        <p className="muted">
          This is a clean starter for Base/Farcaster mini-apps. Replace this
          page with your app logic.
        </p>

        {error && <p className="error">{error}</p>}

        <div className="meta">
          {!user ? (
            <p>Loading user…</p>
          ) : (
            <>
              <p>User FID: {user.fid}</p>
              <p>Username: {user.username ?? "Not available"}</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
