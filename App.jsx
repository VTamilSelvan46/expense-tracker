import React, { useMemo, useState } from "react";

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
];

const STORAGE_KEY = "expense-tracker-data-v1";

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function currencyInfo(code) {
  return CURRENCIES.find((c) => c.code === code) || {
    code,
    symbol: code,
    name: code,
  };
}

export default function ExpenseTracker() {
  const [folders, setFolders] = useState(loadData);
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [search, setSearch] = useState("");
  const [showFolderForm, setShowFolderForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const [folderName, setFolderName] = useState("");
  const [folderCurrency, setFolderCurrency] = useState("INR");

  const [expenseTopic, setExpenseTopic] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [expenseNotes, setExpenseNotes] = useState("");

  const [editingExpenseId, setEditingExpenseId] = useState(null);

  const activeFolder =
    folders.find((folder) => folder.id === activeFolderId) || null;

  const filteredExpenses = useMemo(() => {
    if (!activeFolder) return [];
    const query = search.trim().toLowerCase();

    return activeFolder.expenses.filter((expense) => {
      if (!query) return true;
      return (
        expense.topic.toLowerCase().includes(query) ||
        expense.notes.toLowerCase().includes(query)
      );
    });
  }, [activeFolder, search]);

  const saveFolders = (nextFolders) => {
    setFolders(nextFolders);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFolders));
  };

  const totalFolders = folders.length;

  const totalExpenses = folders.reduce(
    (sum, folder) =>
      sum +
      folder.expenses.reduce((folderSum, expense) => folderSum + expense.amount, 0),
    0
  );

  const createFolder = (event) => {
    event.preventDefault();

    const name = folderName.trim();
    if (!name) return;

    const newFolder = {
      id: makeId(),
      name,
      currency: folderCurrency,
      createdAt: new Date().toISOString(),
      expenses: [],
    };

    const nextFolders = [...folders, newFolder];
    saveFolders(nextFolders);
    setFolderName("");
    setFolderCurrency("INR");
    setShowFolderForm(false);
    setActiveFolderId(newFolder.id);
  };

  const deleteFolder = (folderId) => {
    const folder = folders.find((item) => item.id === folderId);
    if (!folder) return;

    const confirmed = window.confirm(
      `Delete "${folder.name}" and all of its expenses?`
    );
    if (!confirmed) return;

    const nextFolders = folders.filter((item) => item.id !== folderId);
    saveFolders(nextFolders);

    if (activeFolderId === folderId) {
      setActiveFolderId(null);
      setSearch("");
    }
  };

  const openAddExpense = () => {
    setEditingExpenseId(null);
    setExpenseTopic("");
    setExpenseAmount("");
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setExpenseNotes("");
    setShowExpenseForm(true);
  };

  const openEditExpense = (expense) => {
    setEditingExpenseId(expense.id);
    setExpenseTopic(expense.topic);
    setExpenseAmount(String(expense.amount));
    setExpenseDate(expense.date);
    setExpenseNotes(expense.notes);
    setShowExpenseForm(true);
  };

  const saveExpense = (event) => {
    event.preventDefault();

    if (!activeFolder) return;

    const topic = expenseTopic.trim();
    const amount = Number(expenseAmount);

    if (!topic || !Number.isFinite(amount) || amount < 0) return;

    const nextFolders = folders.map((folder) => {
      if (folder.id !== activeFolder.id) return folder;

      if (editingExpenseId) {
        return {
          ...folder,
          expenses: folder.expenses.map((expense) =>
            expense.id === editingExpenseId
              ? {
                  ...expense,
                  topic,
                  amount,
                  date: expenseDate,
                  notes: expenseNotes.trim(),
                }
              : expense
          ),
        };
      }

      return {
        ...folder,
        expenses: [
          ...folder.expenses,
          {
            id: makeId(),
            topic,
            amount,
            date: expenseDate,
            notes: expenseNotes.trim(),
          },
        ],
      };
    });

    saveFolders(nextFolders);
    setShowExpenseForm(false);
    setEditingExpenseId(null);
    setExpenseTopic("");
    setExpenseAmount("");
    setExpenseNotes("");
  };

  const deleteExpense = (expenseId) => {
    if (!activeFolder) return;

    const confirmed = window.confirm("Delete this expense?");
    if (!confirmed) return;

    const nextFolders = folders.map((folder) => {
      if (folder.id !== activeFolder.id) return folder;

      return {
        ...folder,
        expenses: folder.expenses.filter((expense) => expense.id !== expenseId),
      };
    });

    saveFolders(nextFolders);
  };

  const folderTotal =
    activeFolder?.expenses.reduce((sum, expense) => sum + expense.amount, 0) || 0;

  const formatAmount = (amount, code) => {
    const currency = currencyInfo(code);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currency.code,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency.symbol}${amount.toFixed(2)}`;
    }
  };

  return (
    <div style={styles.app}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f4f7fb; color: #14213d; }
        button, input, select, textarea { font: inherit; }
        button { cursor: pointer; }
        .folder-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px rgba(20,33,61,.10); }
        .expense-row:hover { background: #f8fbff; }
        @media (max-width: 900px) {
          .main-grid { grid-template-columns: 1fr !important; }
          .folder-grid { grid-template-columns: 1fr 1fr !important; }
          .summary-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 620px) {
          .folder-grid, .summary-grid { grid-template-columns: 1fr !important; }
          .header-row { flex-direction: column !important; align-items: stretch !important; }
          .table-wrap { overflow-x: auto; }
        }
      `}</style>

      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Expense Tracker</h1>
          <p style={styles.subtitle}>
            Organize expenses your way, in any currency.
          </p>
        </div>

        <button style={styles.primaryButton} onClick={() => setShowFolderForm(true)}>
          + New Folder
        </button>
      </header>

      <main style={styles.container}>
        <section style={styles.summaryGrid} className="summary-grid">
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Total Folders</span>
            <strong style={styles.summaryValue}>{totalFolders}</strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Saved Expenses</span>
            <strong style={styles.summaryValue}>
              {folders.reduce((sum, folder) => sum + folder.expenses.length, 0)}
            </strong>
          </div>
          <div style={styles.summaryCard}>
            <span style={styles.summaryLabel}>Combined Total</span>
            <strong style={styles.summaryValue}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>
                Mixed currencies
              </span>{" "}
              {totalExpenses.toFixed(2)}
            </strong>
            <span style={styles.smallText}>
              Add totals per folder when currencies differ.
            </span>
          </div>
        </section>

        <div style={styles.mainGrid} className="main-grid">
          <section>
            <div style={styles.sectionHeading}>
              <div>
                <h2 style={styles.sectionTitle}>Your Folders</h2>
                <p style={styles.sectionSub}>Create a separate space for each purpose.</p>
              </div>
              <button
                style={styles.secondaryButton}
                onClick={() => setShowFolderForm(true)}
              >
                Create folder
              </button>
            </div>

            {folders.length === 0 ? (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📁</div>
                <h3 style={{ margin: "6px 0 8px" }}>No folders yet</h3>
                <p style={{ color: "#64748b", marginTop: 0 }}>
                  Create your first folder to start tracking expenses.
                </p>
                <button
                  style={styles.primaryButton}
                  onClick={() => setShowFolderForm(true)}
                >
                  + Create your first folder
                </button>
              </div>
            ) : (
              <div style={styles.folderGrid} className="folder-grid">
                {folders.map((folder) => {
                  const total = folder.expenses.reduce(
                    (sum, expense) => sum + expense.amount,
                    0
                  );
                  const currency = currencyInfo(folder.currency);

                  return (
                    <div
                      key={folder.id}
                      className="folder-card"
                      style={{
                        ...styles.folderCard,
                        border:
                          activeFolderId === folder.id
                            ? "2px solid #2563eb"
                            : "1px solid #e2e8f0",
                      }}
                      onClick={() => {
                        setActiveFolderId(folder.id);
                        setSearch("");
                      }}
                    >
                      <div style={styles.folderTop}>
                        <span style={styles.folderIcon}>📁</span>
                        <button
                          style={styles.iconButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteFolder(folder.id);
                          }}
                          aria-label={`Delete ${folder.name}`}
                          title="Delete folder"
                        >
                          🗑️
                        </button>
                      </div>
                      <h3 style={styles.folderName}>{folder.name}</h3>
                      <div style={styles.folderMeta}>
                        <span>
                          {currency.symbol} {folder.currency}
                        </span>
                        <span>{folder.expenses.length} entries</span>
                      </div>
                      <div style={styles.folderTotal}>{formatAmount(total, folder.currency)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section style={styles.detailCard}>
            {!activeFolder ? (
              <div style={styles.detailEmpty}>
                <div style={{ fontSize: 44 }}>🧾</div>
                <h2 style={{ marginBottom: 8 }}>Select a folder</h2>
                <p style={{ color: "#64748b", maxWidth: 360 }}>
                  Choose a folder to add, edit, and review expenses.
                </p>
              </div>
            ) : (
              <>
                <div className="header-row" style={styles.detailHeader}>
                  <div>
                    <div style={styles.breadcrumb}>
                      Folders / <strong>{activeFolder.name}</strong>
                    </div>
                    <h2 style={styles.detailTitle}>{activeFolder.name}</h2>
                    <div style={styles.currencyBadge}>
                      {currencyInfo(activeFolder.currency).symbol}{" "}
                      {activeFolder.currency} — {currencyInfo(activeFolder.currency).name}
                    </div>
                  </div>

                  <button style={styles.primaryButton} onClick={openAddExpense}>
                    + Add Expense
                  </button>
                </div>

                <div style={styles.totalBanner}>
                  <div>
                    <div style={styles.bannerLabel}>Total spent</div>
                    <div style={styles.bannerTotal}>
                      {formatAmount(folderTotal, activeFolder.currency)}
                    </div>
                  </div>
                  <div style={styles.bannerCount}>
                    {activeFolder.expenses.length}{" "}
                    {activeFolder.expenses.length === 1 ? "expense" : "expenses"}
                  </div>
                </div>

                <div style={styles.searchRow}>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search topic or notes..."
                    style={styles.input}
                  />
                </div>

                {filteredExpenses.length === 0 ? (
                  <div style={styles.detailEmptySmall}>
                    <div style={{ fontSize: 35 }}>💸</div>
                    <h3 style={{ margin: "8px 0" }}>
                      {activeFolder.expenses.length === 0
                        ? "No expenses yet"
                        : "No matching expenses"}
                    </h3>
                    <p style={{ color: "#64748b" }}>
                      {activeFolder.expenses.length === 0
                        ? "Add an expense and the total will update automatically."
                        : "Try another search term."}
                    </p>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Topic</th>
                          <th style={styles.th}>Amount</th>
                          <th style={styles.th}>Date</th>
                          <th style={styles.th}>Notes</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses
                          .slice()
                          .sort((a, b) => b.date.localeCompare(a.date))
                          .map((expense) => (
                            <tr key={expense.id} className="expense-row">
                              <td style={styles.td}>
                                <strong>{expense.topic}</strong>
                              </td>
                              <td style={styles.td}>
                                {formatAmount(expense.amount, activeFolder.currency)}
                              </td>
                              <td style={styles.td}>{expense.date}</td>
                              <td style={{ ...styles.td, color: "#64748b" }}>
                                {expense.notes || "—"}
                              </td>
                              <td style={styles.td}>
                                <button
                                  style={styles.actionButton}
                                  onClick={() => openEditExpense(expense)}
                                >
                                  Edit
                                </button>
                                <button
                                  style={{ ...styles.actionButton, color: "#dc2626" }}
                                  onClick={() => deleteExpense(expense.id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </main>

      {(showFolderForm || showExpenseForm) && (
        <div
          style={styles.modalOverlay}
          onMouseDown={() => {
            setShowFolderForm(false);
            setShowExpenseForm(false);
          }}
        >
          <div
            style={styles.modal}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {showFolderForm ? (
              <>
                <div style={styles.modalHeader}>
                  <div>
                    <h2 style={styles.modalTitle}>Create New Folder</h2>
                    <p style={styles.modalSub}>
                      Give your expense collection a name and currency.
                    </p>
                  </div>
                  <button
                    style={styles.closeButton}
                    onClick={() => setShowFolderForm(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={createFolder}>
                  <label style={styles.label}>Folder name</label>
                  <input
                    autoFocus
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="e.g. Pondicherry Trip"
                    style={styles.input}
                    required
                  />

                  <label style={styles.label}>Currency</label>
                  <select
                    value={folderCurrency}
                    onChange={(e) => setFolderCurrency(e.target.value)}
                    style={styles.input}
                  >
                    {CURRENCIES.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} — {currency.name}
                      </option>
                    ))}
                  </select>

                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => setShowFolderForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={styles.primaryButton}>
                      Create Folder
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div style={styles.modalHeader}>
                  <div>
                    <h2 style={styles.modalTitle}>
                      {editingExpenseId ? "Edit Expense" : "Add Expense"}
                    </h2>
                    <p style={styles.modalSub}>
                      Enter any topic you want — there are no fixed categories.
                    </p>
                  </div>
                  <button
                    style={styles.closeButton}
                    onClick={() => setShowExpenseForm(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={saveExpense}>
                  <label style={styles.label}>Expense topic</label>
                  <input
                    autoFocus
                    value={expenseTopic}
                    onChange={(e) => setExpenseTopic(e.target.value)}
                    placeholder="e.g. Hotel, Food, Fuel, Shopping"
                    style={styles.input}
                    required
                  />

                  <label style={styles.label}>
                    Amount ({currencyInfo(activeFolder?.currency).symbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    style={styles.input}
                    required
                  />

                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    style={styles.input}
                    required
                  />

                  <label style={styles.label}>Notes (optional)</label>
                  <textarea
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    placeholder="Add a short note..."
                    style={{ ...styles.input, minHeight: 90, resize: "vertical" }}
                  />

                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      style={styles.secondaryButton}
                      onClick={() => setShowExpenseForm(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" style={styles.primaryButton}>
                      {editingExpenseId ? "Save Changes" : "Add Expense"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    background: "#f4f7fb",
  },
  header: {
    padding: "28px 5%",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  title: {
    margin: 0,
    fontSize: "clamp(28px, 4vw, 42px)",
    letterSpacing: "-1px",
  },
  subtitle: {
    margin: "7px 0 0",
    color: "#64748b",
  },
  container: {
    width: "90%",
    maxWidth: 1400,
    margin: "26px auto 60px",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    marginBottom: 24,
  },
  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 6px 20px rgba(20,33,61,.04)",
  },
  summaryLabel: {
    display: "block",
    color: "#64748b",
    fontSize: 13,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
  },
  smallText: {
    display: "block",
    marginTop: 7,
    color: "#94a3b8",
    fontSize: 11,
  },
  mainGrid: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.5fr",
    gap: 22,
    alignItems: "start",
  },
  sectionHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  sectionTitle: {
    margin: 0,
    fontSize: 22,
  },
  sectionSub: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: 13,
  },
  folderGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  folderCard: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 18,
    cursor: "pointer",
    transition: "all .18s ease",
    boxShadow: "0 6px 20px rgba(20,33,61,.04)",
  },
  folderTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  folderIcon: {
    fontSize: 28,
  },
  iconButton: {
    border: 0,
    background: "transparent",
    color: "#64748b",
    padding: 5,
    borderRadius: 8,
  },
  folderName: {
    margin: "14px 0 8px",
    fontSize: 17,
  },
  folderMeta: {
    display: "flex",
    justifyContent: "space-between",
    color: "#64748b",
    fontSize: 12,
  },
  folderTotal: {
    marginTop: 18,
    fontSize: 21,
    fontWeight: 700,
  },
  detailCard: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    padding: 22,
    minHeight: 530,
    boxShadow: "0 8px 25px rgba(20,33,61,.05)",
  },
  detailEmpty: {
    minHeight: 480,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  detailEmptySmall: {
    padding: "65px 15px",
    textAlign: "center",
  },
  detailHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },
  breadcrumb: {
    color: "#64748b",
    fontSize: 12,
    marginBottom: 7,
  },
  detailTitle: {
    margin: 0,
    fontSize: 27,
  },
  currencyBadge: {
    display: "inline-block",
    marginTop: 9,
    padding: "6px 10px",
    borderRadius: 99,
    background: "#eef5ff",
    color: "#1d4ed8",
    fontSize: 12,
    fontWeight: 600,
  },
  totalBanner: {
    marginTop: 20,
    padding: 18,
    borderRadius: 14,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 20,
  },
  bannerLabel: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 5,
  },
  bannerTotal: {
    fontSize: 28,
    fontWeight: 800,
  },
  bannerCount: {
    color: "#64748b",
    fontSize: 13,
  },
  searchRow: {
    margin: "18px 0 12px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "12px 10px",
    borderBottom: "1px solid #e2e8f0",
    color: "#64748b",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "14px 10px",
    borderBottom: "1px solid #edf2f7",
    verticalAlign: "top",
  },
  actionButton: {
    border: 0,
    background: "transparent",
    color: "#2563eb",
    padding: "4px 7px",
    marginRight: 5,
    fontSize: 12,
  },
  primaryButton: {
    border: 0,
    borderRadius: 11,
    background: "#2563eb",
    color: "#ffffff",
    fontWeight: 700,
    padding: "11px 16px",
    boxShadow: "0 8px 18px rgba(37,99,235,.18)",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: 11,
    background: "#ffffff",
    color: "#334155",
    fontWeight: 600,
    padding: "10px 14px",
  },
  emptyState: {
    background: "#ffffff",
    border: "1px dashed #cbd5e1",
    borderRadius: 16,
    padding: "45px 20px",
    textAlign: "center",
  },
  emptyIcon: {
    fontSize: 45,
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 1000,
  },
  modal: {
    width: "100%",
    maxWidth: 520,
    background: "#ffffff",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 25px 70px rgba(0,0,0,.18)",
    maxHeight: "90vh",
    overflowY: "auto",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 20,
    marginBottom: 20,
  },
  modalTitle: {
    margin: 0,
    fontSize: 23,
  },
  modalSub: {
    color: "#64748b",
    fontSize: 13,
    margin: "6px 0 0",
  },
  closeButton: {
    border: 0,
    background: "#f1f5f9",
    width: 34,
    height: 34,
    borderRadius: 9,
    fontSize: 22,
    color: "#475569",
  },
  label: {
    display: "block",
    fontSize: 13,
    fontWeight: 700,
    color: "#334155",
    margin: "14px 0 7px",
  },
  input: {
    width: "100%",
    border: "1px solid #cbd5e1",
    borderRadius: 10,
    padding: "11px 12px",
    outline: "none",
    background: "#ffffff",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 20,
  },
};

