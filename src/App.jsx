import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  Kanban,
  ListTodo,
  Plus,
  X,
  Search,
  Mail,
  Phone,
  Building2,
  Trash2,
  Pencil,
  Check,
  Clock,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "./supabaseClient";

// ---------- design tokens ----------
const COLORS = {
  page: "#EEF0EA",
  card: "#FFFFFF",
  ink: "#1E2620",
  inkSoft: "#5B6259",
  border: "#DCE0D6",
  borderStrong: "#C3C9BB",
  primary: "#21594A",
  primarySoft: "#E4EEE9",
  gold: "#B8862F",
  goldSoft: "#F6ECD8",
  danger: "#A23B2E",
  dangerSoft: "#F5E4E0",
};

const FONT_SERIF = "Iowan Old Style, Georgia, 'Times New Roman', serif";
const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
const FONT_MONO = "ui-monospace, SFMono-Regular, 'Cascadia Mono', Menlo, monospace";

const STAGES = [
  { id: "lead", label: "Mới liên hệ" },
  { id: "contacted", label: "Đang trao đổi" },
  { id: "proposal", label: "Đề xuất" },
  { id: "negotiation", label: "Đàm phán" },
  { id: "won", label: "Thắng" },
  { id: "lost", label: "Mất" },
];

const STAGE_COLOR = {
  lead: "#7A6F8A",
  contacted: "#3E6E9E",
  proposal: COLORS.gold,
  negotiation: "#B8652F",
  won: COLORS.primary,
  lost: COLORS.danger,
};

const money = (n) =>
  new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(n) || 0) + " ₫";
const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt)) return "—";
  return dt.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const initials = (name = "") =>
  name.trim().split(/\s+/).slice(-2).map((w) => w[0]?.toUpperCase()).join("") || "?";

const NAME_KEY = "crm-user-name";

// ---------- shared UI bits ----------
function Button({ children, onClick, variant = "ghost", style, type = "button", disabled }) {
  const base = {
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    fontWeight: 500,
    padding: "8px 14px",
    borderRadius: 7,
    cursor: disabled ? "default" : "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    border: "1px solid transparent",
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary: { background: COLORS.primary, color: "#fff" },
    ghost: { background: "transparent", color: COLORS.ink, border: `1px solid ${COLORS.borderStrong}` },
    danger: { background: "transparent", color: COLORS.danger, border: `1px solid ${COLORS.dangerSoft}` },
  };
  return (
    <button type={type} disabled={disabled} onClick={onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: FONT_SANS }}>
      <span style={{ fontSize: 12, color: COLORS.inkSoft, fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  fontFamily: FONT_SANS,
  fontSize: 14,
  padding: "8px 10px",
  borderRadius: 6,
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
  color: COLORS.ink,
  outline: "none",
};

function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(30,38,32,0.35)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "6vh 16px",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: COLORS.card,
          borderRadius: 10,
          width,
          maxWidth: "100%",
          maxHeight: "88vh",
          overflowY: "auto",
          border: `1px solid ${COLORS.border}`,
          boxShadow: "0 12px 32px rgba(30,38,32,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <h3 style={{ fontFamily: FONT_SERIF, fontSize: 18, margin: 0, color: COLORS.ink }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft }} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
      </div>
    </div>
  );
}

function Tab({ icon: Icon, label, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        width: "100%",
        padding: "9px 12px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        background: active ? COLORS.primarySoft : "transparent",
        color: active ? COLORS.primary : COLORS.inkSoft,
        fontFamily: FONT_SANS,
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        textAlign: "left",
      }}
    >
      <Icon size={16} />
      <span style={{ flex: 1 }}>{label}</span>
      {typeof count === "number" && <span style={{ fontSize: 12, color: COLORS.inkSoft, fontFamily: FONT_MONO }}>{count}</span>}
    </button>
  );
}

function EmptyHint({ text }) {
  return (
    <div style={{ border: `1px dashed ${COLORS.borderStrong}`, borderRadius: 8, padding: "18px 16px", color: COLORS.inkSoft, fontSize: 13, textAlign: "center" }}>
      {text}
    </div>
  );
}

// ---------- main app ----------
export default function App() {
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [connError, setConnError] = useState(false);
  const [view, setView] = useState("dashboard");
  const [userName, setUserName] = useState(localStorage.getItem(NAME_KEY) || "");
  const [showNamePrompt, setShowNamePrompt] = useState(!localStorage.getItem(NAME_KEY));

  const [contactModal, setContactModal] = useState(null);
  const [dealModal, setDealModal] = useState(null);
  const [taskModal, setTaskModal] = useState(null);
  const [search, setSearch] = useState("");

  const loadAll = useCallback(async () => {
    const [c, d, t] = await Promise.all([
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("deals").select("*").order("updated_at", { ascending: false }),
      supabase.from("tasks").select("*").order("due_date", { ascending: true }),
    ]);
    if (c.error || d.error || t.error) {
      console.error(c.error || d.error || t.error);
      setConnError(true);
      return;
    }
    setConnError(false);
    setContacts(c.data || []);
    setDeals(d.data || []);
    setTasks(t.data || []);
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoaded(true));

    const channel = supabase
      .channel("crm-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "deals" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, loadAll)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  const saveName = (name) => {
    setUserName(name);
    localStorage.setItem(NAME_KEY, name);
    setShowNamePrompt(false);
  };

  // ---------- contact ops ----------
  const upsertContact = async (c) => {
    const { id, ...rest } = c;
    if (id && contacts.some((x) => x.id === id)) {
      await supabase.from("contacts").update(rest).eq("id", id);
    } else {
      await supabase.from("contacts").insert(rest);
    }
    loadAll();
  };
  const deleteContact = async (id) => {
    await supabase.from("contacts").delete().eq("id", id);
    loadAll();
  };

  // ---------- deal ops ----------
  const upsertDeal = async (d) => {
    const { id, ...rest } = d;
    rest.updated_at = new Date().toISOString();
    if (id && deals.some((x) => x.id === id)) {
      await supabase.from("deals").update(rest).eq("id", id);
    } else {
      await supabase.from("deals").insert(rest);
    }
    loadAll();
  };
  const deleteDeal = async (id) => {
    await supabase.from("deals").delete().eq("id", id);
    loadAll();
  };
  const moveDeal = async (id, stage) => {
    await supabase.from("deals").update({ stage, updated_at: new Date().toISOString() }).eq("id", id);
    loadAll();
  };

  // ---------- task ops ----------
  const upsertTask = async (t) => {
    const { id, ...rest } = t;
    if (id && tasks.some((x) => x.id === id)) {
      await supabase.from("tasks").update(rest).eq("id", id);
    } else {
      await supabase.from("tasks").insert(rest);
    }
    loadAll();
  };
  const deleteTask = async (id) => {
    await supabase.from("tasks").delete().eq("id", id);
    loadAll();
  };
  const toggleTask = async (t) => {
    await supabase.from("tasks").update({ done: !t.done }).eq("id", t.id);
    loadAll();
  };

  const contactById = useMemo(() => {
    const m = {};
    contacts.forEach((c) => (m[c.id] = c));
    return m;
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.company || "").toLowerCase().includes(q) ||
        (c.email || "").toLowerCase().includes(q)
    );
  }, [contacts, search]);

  const stats = useMemo(() => {
    const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
    const wonDeals = deals.filter((d) => d.stage === "won");
    const pipelineValue = openDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    const wonValue = wonDeals.reduce((s, d) => s + (Number(d.value) || 0), 0);
    return {
      contacts: contacts.length,
      openDeals: openDeals.length,
      pipelineValue,
      wonValue,
      dueTasks: tasks.filter((t) => !t.done).length,
    };
  }, [contacts, deals, tasks]);

  if (!loaded) {
    return <div style={{ padding: 40, fontFamily: FONT_SANS, color: COLORS.inkSoft }}>Đang tải dữ liệu…</div>;
  }

  if (connError) {
    return (
      <div style={{ padding: 40, fontFamily: FONT_SANS, color: COLORS.danger, maxWidth: 480 }}>
        Không kết nối được tới Supabase. Kiểm tra lại VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
        và đảm bảo đã chạy supabase-schema.sql. Xem README.md để biết chi tiết.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: COLORS.page, fontFamily: FONT_SANS, color: COLORS.ink }}>
      <div style={{ width: 210, flexShrink: 0, borderRight: `1px solid ${COLORS.border}`, padding: "18px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ padding: "2px 10px 16px" }}>
          <div style={{ fontFamily: FONT_SERIF, fontSize: 20, color: COLORS.primary }}>Sổ khách hàng</div>
          <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
            {connError ? <WifiOff size={12} /> : <Wifi size={12} />} Dữ liệu chung của team
          </div>
        </div>
        <Tab icon={LayoutDashboard} label="Tổng quan" active={view === "dashboard"} onClick={() => setView("dashboard")} />
        <Tab icon={Users} label="Khách hàng" active={view === "contacts"} onClick={() => setView("contacts")} count={contacts.length} />
        <Tab icon={Kanban} label="Cơ hội bán hàng" active={view === "deals"} onClick={() => setView("deals")} count={deals.length} />
        <Tab icon={ListTodo} label="Công việc" active={view === "tasks"} onClick={() => setView("tasks")} count={tasks.filter((t) => !t.done).length} />
        <div style={{ marginTop: "auto", padding: "10px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 11, color: COLORS.inkSoft, marginBottom: 4 }}>Đang đăng nhập là</div>
          <button onClick={() => setShowNamePrompt(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 500, color: COLORS.ink }}>
            {userName || "Chưa đặt tên"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "22px 26px", overflowY: "auto" }}>
        {view === "dashboard" && <Dashboard stats={stats} deals={deals} tasks={tasks} contactById={contactById} setView={setView} />}
        {view === "contacts" && (
          <ContactsView
            contacts={filteredContacts}
            search={search}
            setSearch={setSearch}
            onAdd={() => setContactModal({})}
            onEdit={(c) => setContactModal(c)}
            onDelete={deleteContact}
            dealsByContact={deals}
          />
        )}
        {view === "deals" && (
          <DealsView deals={deals} contactById={contactById} onAdd={() => setDealModal({})} onEdit={(d) => setDealModal(d)} onMove={moveDeal} onDelete={deleteDeal} />
        )}
        {view === "tasks" && (
          <TasksView tasks={tasks} contactById={contactById} onAdd={() => setTaskModal({})} onEdit={(t) => setTaskModal(t)} onToggle={toggleTask} onDelete={deleteTask} />
        )}
      </div>

      {contactModal !== null && (
        <ContactModal contact={contactModal} onClose={() => setContactModal(null)} onSave={(c) => { upsertContact(c); setContactModal(null); }} />
      )}
      {dealModal !== null && (
        <DealModal deal={dealModal} contacts={contacts} onClose={() => setDealModal(null)} onSave={(d) => { upsertDeal(d); setDealModal(null); }} />
      )}
      {taskModal !== null && (
        <TaskModal task={taskModal} contacts={contacts} onClose={() => setTaskModal(null)} onSave={(t) => { upsertTask(t); setTaskModal(null); }} />
      )}
      {showNamePrompt && <NameModal initial={userName} onClose={() => setShowNamePrompt(false)} onSave={saveName} />}
    </div>
  );
}

// ---------- dashboard ----------
function StatCard({ label, value }) {
  return (
    <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 16px", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: 12, color: COLORS.inkSoft }}>{label}</div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 22, marginTop: 4, color: COLORS.ink }}>{value}</div>
    </div>
  );
}

function Dashboard({ stats, deals, tasks, contactById, setView }) {
  const upcoming = tasks.filter((t) => !t.done).sort((a, b) => new Date(a.due_date || "9999") - new Date(b.due_date || "9999")).slice(0, 5);
  return (
    <div>
      <h2 style={{ fontFamily: FONT_SERIF, fontSize: 24, margin: "2px 0 18px" }}>Tổng quan</h2>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 22 }}>
        <StatCard label="Khách hàng" value={stats.contacts} />
        <StatCard label="Cơ hội đang mở" value={stats.openDeals} />
        <StatCard label="Giá trị pipeline" value={money(stats.pipelineValue)} />
        <StatCard label="Đã thắng" value={money(stats.wonValue)} />
        <StatCard label="Việc cần làm" value={stats.dueTasks} />
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 320px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ fontFamily: FONT_SERIF, fontSize: 16, margin: 0 }}>Việc sắp đến hạn</h3>
            <Button onClick={() => setView("tasks")} style={{ fontSize: 12.5, padding: "5px 10px" }}>Xem tất cả</Button>
          </div>
          {upcoming.length === 0 ? (
            <EmptyHint text="Không có việc nào đang chờ." />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {upcoming.map((t) => (
                <div key={t.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13.5 }}>{t.title}</div>
                    <div style={{ fontSize: 11.5, color: COLORS.inkSoft }}>{contactById[t.contact_id]?.name || "Không gắn khách hàng"}</div>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: FONT_MONO, color: COLORS.inkSoft }}>{fmtDate(t.due_date)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ flex: "1 1 260px" }}>
          <h3 style={{ fontFamily: FONT_SERIF, fontSize: 16, margin: "0 0 10px" }}>Pipeline theo giai đoạn</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STAGES.map((s) => {
              const count = deals.filter((d) => d.stage === s.id).length;
              const max = Math.max(1, ...STAGES.map((st) => deals.filter((d) => d.stage === st.id).length));
              return (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 92, fontSize: 12, color: COLORS.inkSoft, flexShrink: 0 }}>{s.label}</div>
                  <div style={{ flex: 1, background: COLORS.primarySoft, borderRadius: 5, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${(count / max) * 100}%`, background: STAGE_COLOR[s.id], height: "100%" }} />
                  </div>
                  <div style={{ width: 18, fontSize: 12, fontFamily: FONT_MONO, textAlign: "right" }}>{count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- contacts ----------
function ContactsView({ contacts, search, setSearch, onAdd, onEdit, onDelete, dealsByContact }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12 }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 24, margin: 0 }}>Khách hàng</h2>
        <Button variant="primary" onClick={onAdd}><Plus size={15} /> Thêm khách hàng</Button>
      </div>
      <div style={{ position: "relative", maxWidth: 320, marginBottom: 18 }}>
        <Search size={15} style={{ position: "absolute", left: 10, top: 10, color: COLORS.inkSoft }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, công ty, email…" style={{ ...inputStyle, width: "100%", paddingLeft: 32 }} />
      </div>
      {contacts.length === 0 ? (
        <EmptyHint text="Chưa có khách hàng nào." />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
          {contacts.map((c) => {
            const dealCount = dealsByContact.filter((d) => d.contact_id === c.id).length;
            return (
              <div key={c.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderTop: `3px solid ${COLORS.primary}`, borderRadius: 8, padding: "13px 14px" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: COLORS.primarySoft, color: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12.5, fontWeight: 600, flexShrink: 0 }}>
                    {initials(c.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 500 }}>{c.name}</div>
                    {c.company && <div style={{ fontSize: 12, color: COLORS.inkSoft, display: "flex", alignItems: "center", gap: 4 }}><Building2 size={11} /> {c.company}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>
                    <button onClick={() => onEdit(c)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft }} aria-label="Sửa"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(c.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.danger }} aria-label="Xóa"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4, fontSize: 12.5, color: COLORS.inkSoft }}>
                  {c.email && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Mail size={12} /> {c.email}</div>}
                  {c.phone && <div style={{ display: "flex", alignItems: "center", gap: 5 }}><Phone size={12} /> {c.phone}</div>}
                </div>
                {c.tags && c.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 9 }}>
                    {c.tags.map((tg) => (
                      <span key={tg} style={{ fontSize: 11, background: COLORS.goldSoft, color: COLORS.gold, padding: "2px 7px", borderRadius: 5 }}>{tg}</span>
                    ))}
                  </div>
                )}
                <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.inkSoft, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>{dealCount} cơ hội liên quan</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ContactModal({ contact, onClose, onSave }) {
  const [form, setForm] = useState({
    id: contact.id,
    name: contact.name || "",
    company: contact.company || "",
    email: contact.email || "",
    phone: contact.phone || "",
    tags: (contact.tags || []).join(", "),
    notes: contact.notes || "",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({ ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) });
  };
  return (
    <Modal title={contact.id ? "Sửa khách hàng" : "Thêm khách hàng"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Tên khách hàng *"><input style={inputStyle} value={form.name} onChange={set("name")} placeholder="Nguyễn Văn A" autoFocus /></Field>
        <Field label="Công ty"><input style={inputStyle} value={form.company} onChange={set("company")} placeholder="Công ty TNHH ABC" /></Field>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Email"><input style={inputStyle} value={form.email} onChange={set("email")} placeholder="ten@congty.com" /></Field></div>
          <div style={{ flex: 1 }}><Field label="Số điện thoại"><input style={inputStyle} value={form.phone} onChange={set("phone")} placeholder="0901 234 567" /></Field></div>
        </div>
        <Field label="Nhãn (cách nhau bởi dấu phẩy)"><input style={inputStyle} value={form.tags} onChange={set("tags")} placeholder="VIP, bán lẻ" /></Field>
        <Field label="Ghi chú"><textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={form.notes} onChange={set("notes")} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" type="submit">Lưu khách hàng</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- deals ----------
function DealsView({ deals, contactById, onAdd, onEdit, onMove, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 24, margin: 0 }}>Cơ hội bán hàng</h2>
        <Button variant="primary" onClick={onAdd}><Plus size={15} /> Thêm cơ hội</Button>
      </div>
      <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
        {STAGES.map((stage) => {
          const items = deals.filter((d) => d.stage === stage.id);
          const total = items.reduce((s, d) => s + (Number(d.value) || 0), 0);
          return (
            <div key={stage.id} style={{ minWidth: 210, flex: "0 0 210px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: STAGE_COLOR[stage.id] }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{stage.label}</span>
                <span style={{ fontSize: 11.5, color: COLORS.inkSoft, marginLeft: "auto" }}>{items.length}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.inkSoft, fontFamily: FONT_MONO, marginBottom: 8 }}>{money(total)}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, minHeight: 40 }}>
                {items.map((d) => (
                  <div key={d.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 11px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, cursor: "pointer" }} onClick={() => onEdit(d)}>{d.title}</div>
                      <button onClick={() => onDelete(d.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft, flexShrink: 0 }} aria-label="Xóa"><Trash2 size={12} /></button>
                    </div>
                    <div style={{ fontSize: 11.5, color: COLORS.inkSoft, marginTop: 3 }}>{contactById[d.contact_id]?.name || "—"}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 12.5, marginTop: 5 }}>{money(d.value)}</div>
                    <select value={d.stage} onChange={(e) => onMove(d.id, e.target.value)} style={{ marginTop: 8, width: "100%", fontSize: 11.5, padding: "4px 6px", borderRadius: 5, border: `1px solid ${COLORS.border}`, color: COLORS.inkSoft }}>
                      {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                ))}
                {items.length === 0 && <div style={{ fontSize: 11.5, color: COLORS.inkSoft, border: `1px dashed ${COLORS.border}`, borderRadius: 6, padding: "10px 8px", textAlign: "center" }}>Trống</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DealModal({ deal, contacts, onClose, onSave }) {
  const [form, setForm] = useState({
    id: deal.id,
    title: deal.title || "",
    contact_id: deal.contact_id || contacts[0]?.id || "",
    value: deal.value || "",
    stage: deal.stage || "lead",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, contact_id: form.contact_id || null, value: Number(form.value) || 0 });
  };
  return (
    <Modal title={deal.id ? "Sửa cơ hội" : "Thêm cơ hội"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Tên cơ hội *"><input style={inputStyle} value={form.title} onChange={set("title")} placeholder="Hợp đồng cung cấp thiết bị" autoFocus /></Field>
        <Field label="Khách hàng">
          <select style={inputStyle} value={form.contact_id} onChange={set("contact_id")}>
            <option value="">Chưa gắn khách hàng</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1 }}><Field label="Giá trị (VNĐ)"><input style={inputStyle} type="number" value={form.value} onChange={set("value")} placeholder="50000000" /></Field></div>
          <div style={{ flex: 1 }}><Field label="Giai đoạn">
            <select style={inputStyle} value={form.stage} onChange={set("stage")}>
              {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </Field></div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" type="submit">Lưu cơ hội</Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- tasks ----------
function TasksView({ tasks, contactById, onAdd, onEdit, onToggle, onDelete }) {
  const sorted = [...tasks].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return new Date(a.due_date || "9999") - new Date(b.due_date || "9999");
  });
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 24, margin: 0 }}>Công việc</h2>
        <Button variant="primary" onClick={onAdd}><Plus size={15} /> Thêm việc</Button>
      </div>
      {sorted.length === 0 ? (
        <EmptyHint text="Chưa có công việc nào." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sorted.map((t) => (
            <div key={t.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "11px 13px", display: "flex", alignItems: "center", gap: 12, opacity: t.done ? 0.55 : 1 }}>
              <button onClick={() => onToggle(t)} aria-label={t.done ? "Đánh dấu chưa xong" : "Đánh dấu hoàn thành"} style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${t.done ? COLORS.primary : COLORS.borderStrong}`, background: t.done ? COLORS.primary : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                {t.done && <Check size={12} color="#fff" />}
              </button>
              <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => onEdit(t)}>
                <div style={{ fontSize: 13.5, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                <div style={{ fontSize: 11.5, color: COLORS.inkSoft, display: "flex", gap: 10, marginTop: 2 }}>
                  {contactById[t.contact_id]?.name && <span>{contactById[t.contact_id].name}</span>}
                  {t.due_date && <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} /> {fmtDate(t.due_date)}</span>}
                </div>
              </div>
              <button onClick={() => onDelete(t.id)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.inkSoft }} aria-label="Xóa"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TaskModal({ task, contacts, onClose, onSave }) {
  const [form, setForm] = useState({
    id: task.id,
    title: task.title || "",
    contact_id: task.contact_id || "",
    due_date: task.due_date || "",
    done: task.done || false,
  });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave({ ...form, contact_id: form.contact_id || null, due_date: form.due_date || null });
  };
  return (
    <Modal title={task.id ? "Sửa việc cần làm" : "Thêm việc cần làm"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Nội dung công việc *"><input style={inputStyle} value={form.title} onChange={set("title")} placeholder="Gọi điện xác nhận báo giá" autoFocus /></Field>
        <Field label="Khách hàng liên quan">
          <select style={inputStyle} value={form.contact_id} onChange={set("contact_id")}>
            <option value="">Không gắn khách hàng</option>
            {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Hạn hoàn thành"><input style={inputStyle} type="date" value={form.due_date} onChange={set("due_date")} /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" type="submit">Lưu việc cần làm</Button>
        </div>
      </form>
    </Modal>
  );
}

function NameModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial || "");
  return (
    <Modal title="Bạn là ai?" onClose={onClose} width={360}>
      <p style={{ fontSize: 13, color: COLORS.inkSoft, marginTop: 0 }}>Tên của bạn chỉ lưu trên trình duyệt này, dùng để hiển thị ai đang đăng nhập.</p>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim()); }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Tên của bạn"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Minh" autoFocus /></Field>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={onClose}>Bỏ qua</Button>
          <Button variant="primary" type="submit">Lưu</Button>
        </div>
      </form>
    </Modal>
  );
}
