# ⬛ Logical Brutalism: Empirical Benchmarks

> *"What does not resolve, does not exist."*

Empirical performance tests comparing the **Logical Brutalism** stack (Python/FastAPI + HTMX + Alpine.js) against modern Virtual DOM SPAs (React + UI Libraries) under high-frequency B2B stress.

## ⚡ The Core Thesis
Modern Single-Page Applications treat memory like an infinite resource. High-frequency updates (e.g., WebSockets in an order book) force Virtual DOM frameworks to reconcile the entire tree, causing layout thrashing, DOM node explosion, and massive garbage collection spikes.

This repository serves as a reproducible laboratory to prove that **Server-Driven Hypermedia** combined with a minimalist, flat-DOM design system outperforms traditional SPA architectures in data-dense enterprise environments.

---

## 🏗️ The Architecture Matrix

We benchmarked **4 distinct high-density B2B applications** across **5 different UI ecosystems**:

### The Applications
1. `financial-dashboard` (High-frequency data visualization)
2. `inventory-erp` (Complex CRUD and state management)
3. `order-book` (Real-time WebSocket streaming)
4. `server-control-center` (High-density telemetry)

### The Competitors (Virtual DOM vs. Server-Driven UI)
- **Logical Brutalism** (FastAPI, HTMX, Alpine.js, Tailwind) - *The Baseline*
- **Material Design** (React + MUI)
- **Ant Design** (React + antd)
- **Chakra UI** (React + @chakra-ui/react)
- **Mantine** (React + @mantine/core)

---

## 📊 Benchmark Methodology

Each environment is stress-tested against the following metrics:
* **Initial Payload (JS Bundle Size):** The upfront parse/compile tax shipped to the client.
* **Heap Memory Allocation:** Memory footprint under sustained WebSocket data injection.
* **p95 Latency:** Time-to-Interactive (TTI) and update cycle stability.
* **DOM Node Depth:** The structural complexity required to render identical UI blocks.

*(Full flamegraphs and benchmark data will be published in the `/docs/benchmarks` directory shortly).*

---

## ⚙️ Getting Started (Local Execution)

This repository is structured as a monorepo. The root runs the FastAPI benchmarking portal, while the subdirectories contain the isolated Node.js/React applications.

### 1. Requirements
- Python 3.10+
- Node.js 18+ & npm

### 2. Bootstrapping the Python Chassis
Clone the repository and spin up the Server-Driven portal:

```bash
git clone [https://github.com/your-username/logical-brutalism-benchmarks.git](https://github.com/your-username/logical-brutalism-benchmarks.git)
cd logical-brutalism-benchmarks

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # Or `venv\Scripts\activate` on Windows

# Install Python dependencies
pip install -r requirements.txt

# Start the portal
python main.py

```

*The benchmark index will be available at `http://127.0.0.1:8000`.*

### 3. Running the SPA Benchmarks

To run any of the Virtual DOM competitors, use the root NPM workspaces to install dependencies cleanly without conflicts:

```bash
# From the root directory, install all workspace dependencies
npm install

# Navigate to a specific benchmark
cd AntDesign/financial-dashboard

# Run the React environment
npm run dev

```

---

## 🤝 Peer Review & Contribution

This is an open laboratory. If you find a flaw in our benchmarking methodology or believe a specific React implementation can be optimized to beat the HTMX baseline, submit a PR. Data wins arguments.

**License:** MIT