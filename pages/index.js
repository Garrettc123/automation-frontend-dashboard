import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/client/dashboard';
const API_URL = process.env.NEXT_PUBLIC_ENTERPRISE_API_URL || 'http://localhost:8000';

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    mrr: 0,
    systemHealth: 100,
    activeCustomers: 0,
    activeAgents: 0,
    totalTransactions: 0,
    revenueToday: 0,
  });
  const [mrrHistory, setMrrHistory] = useState([]);
  const [wallet, setWallet] = useState({ total: 0, tokens: 0, fiat: 0 });
  const [connected, setConnected] = useState(false);
  const [timestamp, setTimestamp] = useState('--');

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    let ws;
    let reconnectTimer;

    function connect() {
      try {
        ws = new WebSocket(WS_URL);
        ws.onopen = () => setConnected(true);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'metrics') {
              setMetrics(prev => ({ ...prev, ...data.payload }));
            }
            if (data.type === 'mrr_history') {
              setMrrHistory(data.payload || []);
            }
            if (data.type === 'wallet') {
              setWallet(data.payload);
            }
            if (data.timestamp) {
              setTimestamp(new Date(data.timestamp).toLocaleTimeString());
            }
          } catch (e) { /* ignore parse errors */ }
        };
        ws.onclose = () => {
          setConnected(false);
          reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
      } catch (e) {
        reconnectTimer = setTimeout(connect, 5000);
      }
    }

    connect();

    // Fetch initial data via REST
    async function fetchInitial() {
      try {
        const res = await fetch(`${API_URL}/api/metrics`);
        const data = await res.json();
        if (data.metrics) setMetrics(prev => ({ ...prev, ...data.metrics }));
        if (data.mrr_history) setMrrHistory(data.mrr_history);
        if (data.wallet) setWallet(data.wallet);
      } catch (e) { /* API not ready yet */ }
    }
    fetchInitial();

    return () => {
      if (ws) ws.close();
      clearTimeout(reconnectTimer);
    };
  }, []);

  const mrrData = mrrHistory.length > 0 ? mrrHistory : [
    { date: 'Mar 24', mrr: 950 },
    { date: 'Mar 26', mrr: 1100 },
    { date: 'Mar 28', mrr: 1250 },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Enterprise Command Center</h1>
          <p style={styles.subtitle}>Real-Time Revenue & Health Monitoring</p>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.badge, background: connected ? '#22c55e' : '#ef4444' }}>
            {connected ? '● LIVE' : '○ OFFLINE'}
          </span>
          <span style={styles.timestamp}>Last update: {timestamp}</span>
        </div>
      </header>

      {/* Metric Cards */}
      <div style={styles.grid}>
        <div style={{ ...styles.card, borderLeft: '4px solid #22c55e' }}>
          <div style={styles.cardLabel}>Monthly Recurring Revenue</div>
          <div style={styles.cardValue}>${metrics.mrr.toLocaleString()}</div>
          <div style={styles.cardTarget}>Target: $5,000</div>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #3b82f6' }}>
          <div style={styles.cardLabel}>System Health</div>
          <div style={styles.cardValue}>{metrics.systemHealth}%</div>
          <div style={styles.cardTarget}>All systems nominal</div>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #a855f7' }}>
          <div style={styles.cardLabel}>Active Customers</div>
          <div style={styles.cardValue}>{metrics.activeCustomers}</div>
          <div style={styles.cardTarget}>Target: 50</div>
        </div>
        <div style={{ ...styles.card, borderLeft: '4px solid #f59e0b' }}>
          <div style={styles.cardLabel}>Active Agents</div>
          <div style={styles.cardValue}>{metrics.activeAgents}</div>
          <div style={styles.cardTarget}>Target: 10</div>
        </div>
      </div>

      {/* Wallet Section */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Unified Wallet</h2>
        <div style={styles.grid}>
          <div style={{ ...styles.card, background: 'linear-gradient(135deg, #1e3a5f, #0f172a)' }}>
            <div style={styles.cardLabel}>Total Wallet Value</div>
            <div style={{ ...styles.cardValue, color: '#22c55e' }}>${wallet.total.toLocaleString()}</div>
          </div>
          <div style={{ ...styles.card, background: '#0f172a' }}>
            <div style={styles.cardLabel}>NWU Tokens</div>
            <div style={{ ...styles.cardValue, color: '#a855f7' }}>{(wallet.tokens || 0).toLocaleString()}</div>
          </div>
          <div style={{ ...styles.card, background: '#0f172a' }}>
            <div style={styles.cardLabel}>Fiat Balance</div>
            <div style={{ ...styles.cardValue, color: '#3b82f6' }}>${(wallet.fiat || 0).toLocaleString()}</div>
          </div>
          <div style={{ ...styles.card, background: '#0f172a' }}>
            <div style={styles.cardLabel}>Today's Revenue</div>
            <div style={{ ...styles.cardValue, color: '#f59e0b' }}>${metrics.revenueToday.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* MRR Chart */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>MRR Growth</h2>
        <div style={styles.chartContainer}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={mrrData}>
              <defs>
                <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="mrr" stroke="#22c55e" fillOpacity={1} fill="url(#mrrGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Footer */}
      <div style={styles.footer}>
        <p>Enterprise Unified Platform · APEX Revenue System · NWU Protocol</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#0a0a1a',
    color: '#e0e0e0',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    paddingBottom: '16px',
    borderBottom: '1px solid #1e293b',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    margin: 0,
    color: '#f0f0f0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    margin: '4px 0 0',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },
  timestamp: {
    fontSize: '12px',
    color: '#666',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  card: {
    background: '#111827',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #1e293b',
  },
  cardLabel: {
    fontSize: '13px',
    color: '#888',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#f0f0f0',
    marginBottom: '4px',
  },
  cardTarget: {
    fontSize: '12px',
    color: '#555',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#ccc',
  },
  chartContainer: {
    background: '#111827',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #1e293b',
  },
  footer: {
    textAlign: 'center',
    padding: '24px',
    color: '#444',
    fontSize: '12px',
  },
};