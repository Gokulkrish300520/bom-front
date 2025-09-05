"use client";
import { useState } from "react";

// Props types for subcomponents
type HomeProps = {
  onConnect: () => void;
  onManual: () => void;
};
type ConnectProps = {
  onBack: () => void;
};
type ManualProps = {
  onCancel: () => void;
};

export default function BankingOnePage() {
  const [view, setView] = useState<"home" | "connect" | "manual">("home");

  return (
    <div className="page">
      {view === "home" && <Home onConnect={() => setView("connect")} onManual={() => setView("manual")} />}
      {view === "connect" && <Connect onBack={() => setView("home")} />}
      {view === "manual" && <Manual onCancel={() => setView("home")} />}

      {/* your styles */}
      <style jsx global>{`
        :root {
          --g-50: #f2fbf3;
          --g-100: #e0f5e2;
          --g-200: #c7eccb;
          --g-300: #9fdfab;
          --g-400: #6fcd82;
          --g-500: #38b36e;
          --g-600: #2d9b5c;
          --g-700: #237a49;
          --g-800: #1b5c38;
          --g-900: #133f27;
        }
        * { box-sizing: border-box; }
        body { margin: 0; background: var(--g-50); font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #102a13; }
        .page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 40px 20px; }
        .card { width: 100%; max-width: 980px; background: #fff; border: 1px solid var(--g-200); border-radius: 16px; box-shadow: 0 10px 30px rgba(12, 68, 28, 0.08); padding: 28px; }
        .title { margin: 0 0 8px; color: var(--g-700); font-weight: 800; }
        .muted { color: #4b5b4f; }
        .row { display: flex; gap: 12px; align-items: center; }
        .btn { appearance: none; border: none; background: var(--g-600); color: #fff; padding: 12px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: transform .02s ease, box-shadow .2s ease, background .2s ease; box-shadow: 0 6px 14px rgba(14, 92, 42, 0.2); }
        .btn:hover { background: var(--g-700); }
        .btn:active { transform: translateY(1px); }
        .btn-ghost { background: var(--g-200); color: #0f2a12; box-shadow: none; }
        .btn-ghost:hover { background: var(--g-300); }
        .divider { height: 1px; background: var(--g-100); margin: 22px 0; }
        .pill { display: inline-flex; align-items: center; gap: 8px; font-size: 12px; background: var(--g-100); color: var(--g-700); padding: 6px 10px; border-radius: 999px; }
        .grid { display: grid; gap: 12px; }
        .grid-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        .grid-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .bank { border: 1px solid var(--g-200); border-radius: 12px; padding: 16px; text-align: center; font-weight: 600; color: #194a28; background: #fff; }
        .bank:hover { border-color: var(--g-400); box-shadow: 0 6px 16px rgba(21, 106, 49, 0.08); }
        /* Form */
        .form { display: grid; gap: 16px; max-width: 640px; }
        .label { font-weight: 600; color: var(--g-700); margin-bottom: 6px; display: inline-block; }
        .control, .select, .textarea { width: 100%; border: 1px solid var(--g-300); border-radius: 10px; padding: 10px 12px; font-size: 14px; outline: none; transition: border-color .2s, box-shadow .2s; background: #fff; }
        .textarea { min-height: 96px; resize: vertical; }
        .control:focus, .select:focus, .textarea:focus { border-color: var(--g-500); box-shadow: 0 0 0 3px rgba(56, 179, 110, 0.2); }
        .radio-row { display: flex; gap: 18px; align-items: center; }
        .hint { font-size: 12px; color: #5a6d5f; }
        @media (max-width: 900px) {
          .grid-5 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      `}</style>
    </div>
  );
}


/* ----------------------------- Screen: Home ----------------------------- */
function Home({ onConnect, onManual }: HomeProps) {
  return (
    <div className="card" role="main" aria-label="Banking Home">
      <h1 className="title" style={{ fontSize: 26 }}>Stay on top of your money</h1>
      <p className="muted" style={{ maxWidth: 740 }}>
        Connect your bank and credit cards to fetch all your transactions. Create,
        categorize and match these transactions to those you have in Glonix.
      </p>
      <div style={{ height: 18 }} />
      <div className="row" style={{ gap: 14 }}>
        <button className="btn" onClick={onConnect}>Connect Bank / Credit Card</button>
        <button className="btn btn-ghost" onClick={onManual}>Add Manually</button>
      </div>
      <div style={{ height: 14 }} />
      <div className="hint">Don&apos;t use banking for your business? <span style={{ color: 'var(--g-700)', fontWeight: 700, cursor: 'pointer' }}>Skip</span></div>
      <div className="divider" />
      <div className="row"></div>
    </div>
  );
}

/* --------------------------- Screen: Connect ---------------------------- */
function Connect({ onBack }: ConnectProps) {
  return (
    <div className="card" role="main" aria-label="Connect Bank Feeds">
      <h2 className="title" style={{ fontSize: 22 }}>
        Connect and Add Your Bank Accounts or Credit Cards
      </h2>
      <p className="muted">
        Connect your bank accounts to fetch the bank feeds using one of our third-party bank feeds
        service providers. Or, you can add your bank accounts manually and import bank feeds.
      </p>
      <div style={{ height: 16 }} />
      <div className="pill" aria-label="Partner banks">Partner Banks fetch feeds directly</div>
      <div style={{ height: 12 }} />
      <div className="grid grid-5">
        {["Standard Chartered", "HSBC", "Kotak Mahindra Bank", "YES Bank", "SBI"].map((b) => (
          <div key={b} className="bank">{b}</div>
        ))}
      </div>
      <div style={{ height: 22 }} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3 className="title" style={{ fontSize: 18, margin: 0 }}>Automatic Bank Feeds Supported Banks</h3>
        <button className="btn">Connect Now</button>
      </div>
      <div style={{ height: 12 }} />
      <div className="grid grid-3">
        {[
          "PayPal",
          "ICICI Bank (India)",
          "HDFC Bank (India)",
          "State Bank of India (India) - B...",
          "Kotak Mahindra Bank (India)",
          "Axis Bank (India)",
          "HDFC Bank (India) - Credit C...",
          "State Bank of India Credit Ca...",
          "American Express Cards (India)",
        ].map((b) => (
          <div key={b} className="bank">{b}</div>
        ))}
      </div>
      <div style={{ height: 22 }} />
      <button className="btn btn-ghost" onClick={onBack}>⬅ Back</button>
    </div>
  );
}

/* ---------------------------- Screen: Manual ---------------------------- */
function Manual({ onCancel }: ManualProps) {
  return (
    <div className="card" role="main" aria-label="Add Bank or Credit Card">
      <h2 className="title" style={{ fontSize: 22 }}>Add Bank or Credit Card</h2>
      <form className="form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <span className="label">Select Account Type*</span>
          <div className="radio-row">
            <label className="row" style={{ gap: 8 }}>
              <input type="radio" name="accType" defaultChecked /> Bank
            </label>
            <label className="row" style={{ gap: 8 }}>
              <input type="radio" name="accType" /> Credit Card
            </label>
          </div>
        </div>
        <div>
          <label className="label">Account Name*</label>
          <input className="control" type="text" placeholder="" />
        </div>
        <div>
          <label className="label">Account Code</label>
          <input className="control" type="text" placeholder="" />
        </div>
        <div>
          <label className="label">Currency*</label>
          <select className="select" defaultValue="INR" aria-label="Currency">
            <option value="INR">INR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
        <div>
          <label className="label">Account Number</label>
          <input className="control" type="text" placeholder="" />
        </div>
        <div>
          <label className="label">Bank Name</label>
          <input className="control" type="text" placeholder="" />
        </div>
        <div>
          <label className="label">IFSC</label>
          <input className="control" type="text" placeholder="" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="textarea" />
        </div>
        <label className="row" style={{ gap: 10 }}>
          <input type="checkbox" /> <span>Make this primary</span>
        </label>
        <div className="row" style={{ gap: 12 }}>
          <button className="btn" type="submit">Save</button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}