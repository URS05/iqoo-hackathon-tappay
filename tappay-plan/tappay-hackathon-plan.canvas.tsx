import {
  BarChart,
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  CollapsibleSection,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  PieChart,
  Pill,
  Row,
  Stack,
  Stat,
  Table,
  Text,
  computeDAGLayout,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type TabId = "overview" | "flow" | "nfc" | "stack" | "data" | "pitch";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "flow", label: "System flow" },
  { id: "nfc", label: "NFC architecture" },
  { id: "stack", label: "Tech stack" },
  { id: "data", label: "Data + fraud" },
  { id: "pitch", label: "Demo + pitch" },
];

function FlowChart({
  nodes,
  edges,
  labels,
  direction = "horizontal",
  nodeWidth = 148,
  nodeHeight = 52,
}: {
  nodes: { id: string }[];
  edges: { from: string; to: string }[];
  labels: Record<string, { title: string; sub?: string }>;
  direction?: "horizontal" | "vertical";
  nodeWidth?: number;
  nodeHeight?: number;
}) {
  const theme = useHostTheme();
  const layout = computeDAGLayout({
    nodes,
    edges,
    direction,
    nodeWidth,
    nodeHeight,
    rankGap: 56,
    nodeGap: 28,
    padding: 12,
  });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ display: "block", maxWidth: layout.width }}
    >
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={theme.accent.primary} />
        </marker>
      </defs>
      {layout.edges.map((e, i) => {
        const dx = e.targetX - e.sourceX;
        const dy = e.targetY - e.sourceY;
        const mx = e.sourceX + dx * 0.55;
        const my = e.sourceY + dy * 0.45;
        const d = `M ${e.sourceX} ${e.sourceY} Q ${mx} ${my} ${e.targetX} ${e.targetY}`;
        return (
          <path
            key={`${e.from}-${e.to}-${i}`}
            d={d}
            fill="none"
            stroke={e.isBackEdge ? theme.stroke.primary : theme.accent.primary}
            strokeWidth={1.5}
            strokeDasharray={e.isBackEdge ? "5 4" : undefined}
            markerEnd="url(#arrow)"
          />
        );
      })}
      {layout.nodes.map((n) => {
        const meta = labels[n.id] ?? { title: n.id };
        return (
          <g key={n.id}>
            <rect
              x={n.x}
              y={n.y}
              width={nodeWidth}
              height={nodeHeight}
              rx={6}
              fill={theme.fill.tertiary}
              stroke={theme.stroke.secondary}
            />
            <text
              x={n.x + nodeWidth / 2}
              y={n.y + (meta.sub ? 20 : 30)}
              textAnchor="middle"
              fill={theme.text.primary}
              fontSize="12"
              fontWeight={590}
            >
              {meta.title}
            </text>
            {meta.sub ? (
              <text
                x={n.x + nodeWidth / 2}
                y={n.y + 38}
                textAnchor="middle"
                fill={theme.text.tertiary}
                fontSize="10"
              >
                {meta.sub}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function Overview() {
  return (
    <Stack gap={20}>
      <Callout tone="info" title="Phone-first, tag as MVP">
        Any Android phone with NFC is the merchant terminal (reader). The wristband or card
        is only an identity token. Balance lives in the cloud, not as cash on
        the tag. Palm-vein later replaces the tag. The tap protocol stays the same.
      </Callout>

      <Grid columns={4} gap={12}>
        <Stat value="Android" label="NFC phones, merchant + user" />
        <Stat value="Android-first" label="iOS is out of scope for now" />
        <Stat value="On-device ML" label="CPU default, NPU optional" />
        <Stat value="Closed loop" label="Prepaid, not UPI tap" />
      </Grid>

      <H2>Product in one sentence</H2>
      <Text>
        Wonderla / metro / event-wristband prepaid: bind a tag, load rupees, tap
        at a stall, balance drops, both screens update. No UPI in the critical
        path of the tap. Mock UPI only on top-up.
      </Text>

      <H2>Capability layers (not a schedule)</H2>
      <Text size="small" tone="secondary">
        Red Light = phone-only surfaces you can show even if the network is
        ugly. Green Light = money correctness. Build both; they are layers,
        not a clock.
      </Text>
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader trailing={<Pill>Red Light</Pill>}>Device + UI</CardHeader>
          <CardBody>
            <Text size="small">
              Role switch (User / Merchant). Merchant full-screen tap target and
              amount keypad. User wallet, load-money sheet, fake UPI success.
              NFC read UID + NDEF write on the merchant Android phone. Local mock ledger so the
              UI never bricks. Confirmation animation, fail states, haptics.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill active>Green Light</Pill>}>Ledger + rules</CardHeader>
          <CardBody>
            <Text size="small">
              Firebase project, rules, anonymous auth. Collections for tags,
              wallets, transactions. Atomic deduct: read, check, subtract, log.
              Realtime listeners on both roles. Fraud features + merchant
              warning. Freeze / insufficient-funds paths.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <H2>What you are not building</H2>
      <Table
        headers={["Out of scope for MVP", "Why"]}
        rows={[
          ["Real UPI / NPCI / acquiring", "Closed-loop prepaid is the product"],
          ["Google Pay / CATEGORY_PAYMENT HCE", "Fights the system wallet picker"],
          ["Balance stored only on the tag", "Cloned tag would print money"],
          ["iOS merchant terminal", "Out of scope for now. Android only"],
          ["Separate admin web app", "Third role in the same APK is enough"],
        ]}
        striped
      />
    </Stack>
  );
}

function Flows() {
  return (
    <Stack gap={20}>
      <H2>End-to-end payment graph</H2>
      <Text size="small" tone="secondary">
        Solid arrows are the happy path. Dashed arrows are live UI sync back
        from Firestore.
      </Text>
      <FlowChart
        nodeWidth={150}
        nodeHeight={54}
        nodes={[
          { id: "reg" },
          { id: "tag" },
          { id: "topup" },
          { id: "wallet" },
          { id: "tap" },
          { id: "reader" },
          { id: "tx" },
          { id: "fraud" },
          { id: "ui" },
        ]}
        edges={[
          { from: "reg", to: "tag" },
          { from: "tag", to: "topup" },
          { from: "topup", to: "wallet" },
          { from: "tag", to: "tap" },
          { from: "tap", to: "reader" },
          { from: "reader", to: "tx" },
          { from: "wallet", to: "tx" },
          { from: "tx", to: "fraud" },
          { from: "tx", to: "ui" },
        ]}
        labels={{
          reg: { title: "1. Register", sub: "Bind UID → user" },
          tag: { title: "NFC tag", sub: "NDEF + UID" },
          topup: { title: "2. Load", sub: "Mock UPI" },
          wallet: { title: "Wallet", sub: "Firestore paise" },
          tap: { title: "3. Tap", sub: "At stall" },
          reader: { title: "Merchant reader", sub: "IsoDep / NDEF" },
          tx: { title: "4. Deduct", sub: "Atomic txn" },
          fraud: { title: "Fraud score", sub: "On-device" },
          ui: { title: "5. Confirm", sub: "User + merchant" },
        }}
      />

      <H2>Actors and what they own</H2>
      <Grid columns={3} gap={12}>
        <Card>
          <CardHeader trailing={<Pill>User phone</Pill>}>User app</CardHeader>
          <CardBody>
            <Text size="small">
              Register tag, show balance, mock UPI top-up, transaction list.
              Does not need to be at the stall if the tag is already bound.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill active>Hero device</Pill>}>Merchant app</CardHeader>
          <CardBody>
            <Text size="small">
              Full-screen tap target, amount keypad, NFC reader session,
              success/fail, live queue of taps. This is the judge visual.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader trailing={<Pill>Optional</Pill>}>Admin</CardHeader>
          <CardBody>
            <Text size="small">
              Tag list, freeze tag, replay ledger. If time slips, merchant
              history stands in. Same APK, third role.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <H2>Four product loops</H2>
      <Grid columns={2} gap={12}>
        <Stack gap={8}>
          <H3>Register</H3>
          <Text size="small">
            User holds tag to their phone (or merchant onboards it). App writes
            NDEF: app id, schema version, display name. Reads hardware UID.
            Creates <Code>tags/&#123;uid&#125;</Code> and{" "}
            <Code>wallets/&#123;uid&#125;</Code> at 0 paise.
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Load</H3>
          <Text size="small">
            User picks ₹100 / ₹500 / custom. Fake UPI sheet succeeds. Cloud
            increment on wallet. Tag is not rewritten with the new balance.
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Pay</H3>
          <Text size="small">
            Merchant enters amount, listens. Tag enters field. UID lookup,
            fraud score, Firestore transaction, both UIs confirm.
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Recover</H3>
          <Text size="small">
            Lost tag: freeze UID, issue new tag, transfer wallet pointer.
            Insufficient funds and NFC cancel are first-class screens.
          </Text>
        </Stack>
      </Grid>

      <H2>Tap sequence (what happens in the field)</H2>
      <Table
        headers={["Step", "Where", "Rule"]}
        rows={[
          ["Discover tag", "Android NFC", "enableReaderMode, NDEF + IsoDep"],
          ["Read UID + payload", "Merchant app", "UID is the account key"],
          ["Optional HMAC check", "App", "Detect rewritten / cloned NDEF"],
          ["Run fraud features", "CPU, later NPU", "Amount, velocity, hour, merchant"],
          ["Firestore transaction", "Cloud", "if balance >= amount then deduct"],
          ["Write confirmation", "Both clients", "Realtime listener, haptic + UI"],
          ["Do not write new balance to tag", "Tag", "Tag is ID, not a ledger"],
        ]}
        rowTone={[
          "info",
          "info",
          "warning",
          "warning",
          "success",
          "success",
          "danger",
        ]}
        striped
      />

      <Callout tone="warning" title="Do not store rupees only on the tag">
        Offline NDEF balance is a demo cheat and a security fail. If hall Wi-Fi
        dies, queue the tap locally on the merchant phone and sync when the
        network returns. Cloud (or a properly signed offline counter) stays the
        authority. Do not fall back to writing the new balance onto the tag.
      </Callout>
    </Stack>
  );
}

function Nfc() {
  return (
    <Stack gap={20}>
      <H2>Android NFC: three layers, three jobs</H2>
      <Grid columns={3} gap={12}>
        <Card>
          <CardHeader>NDEF</CardHeader>
          <CardBody>
            <Text size="small">
              Primary MVP path. Write a small record: app id, tag version, user
              display name. Read on tap. Cheap NTAG213/215 wristbands are more
              reliable for the demo than phone-as-card.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>IsoDep / APDU</CardHeader>
          <CardBody>
            <Text size="small">
              Looks like a real card conversation (SELECT AID then GET DATA).
              Useful later for DESFire, or if you add HCE after tags work.
              Optional polish, not the MVP.
            </Text>
          </CardBody>
        </Card>
        <Card>
          <CardHeader>HCE (HostApduService)</CardHeader>
          <CardBody>
            <Text size="small">
              Strictly P2 / bonus. User phone emulates a wristband. Merchant
              still uses reader mode. Only attempt this after the physical-tag
              flow is rock solid. If you do it, use a custom AID in{" "}
              <Code>CATEGORY_OTHER</Code>, never Google Pay’s payment category.
            </Text>
          </CardBody>
        </Card>
      </Grid>

      <H2>Who talks to whom</H2>
      <FlowChart
        direction="vertical"
        nodeWidth={170}
        nodeHeight={52}
        nodes={[
          { id: "stall" },
          { id: "reader" },
          { id: "rf" },
          { id: "token" },
          { id: "hce" },
        ]}
        edges={[
          { from: "stall", to: "reader" },
          { from: "reader", to: "rf" },
          { from: "rf", to: "token" },
          { from: "rf", to: "hce" },
        ]}
        labels={{
          stall: { title: "Merchant UI", sub: "Amount + listen" },
          reader: { title: "NfcAdapter reader", sub: "Phone as POS" },
          rf: { title: "NFC-A / ISO-DEP", sub: "13.56 MHz field" },
          token: { title: "Physical tag", sub: "MVP wristband" },
          hce: { title: "HCE on user phone", sub: "P2 / bonus only" },
        }}
      />

      <H2>HCE vs terminal - the mix-up</H2>
      <Table
        headers={["Mode", "This device is…", "TapPay use"]}
        rows={[
          ["Reader mode", "Initiator / POS", "Any Android NFC phone"],
          ["Tag / card", "Target / wallet", "Wristband NTAG - MVP"],
          ["HCE", "Phone pretending to be a card", "P2 bonus, after tags work"],
          ["Secure Element / GPay", "Bank card emulation", "Out of scope"],
        ]}
        rowTone={["success", "success", "info", "danger"]}
        striped
      />

      <H2>APIs you will actually call</H2>
      <Table
        headers={["API", "Role in TapPay", "Priority"]}
        rows={[
          ["NfcAdapter.enableReaderMode", "Merchant terminal loop", "P0"],
          ["Ndef.get / writeNdefMessage", "Register + display name", "P0"],
          ["Tag.getId()", "Stable account key", "P0"],
          ["IsoDep.connect / transceive", "Optional APDU polish", "P1"],
          ["HostApduService.processCommandApdu", "HCE bonus only after tags work", "P2"],
          ["CardEmulation CATEGORY_PAYMENT", "Avoid - conflicts with GPay", "Skip"],
        ]}
        rowTone={["success", "success", "success", "info", "warning", "danger"]}
        striped
      />

      <H2>Suggested APDU sketch (IsoDep / HCE)</H2>
      <Table
        headers={["Command", "Meaning", "Response"]}
        rows={[
          ["00 A4 04 00 + AID", "SELECT TapPay app", "FCI + 90 00"],
          ["80 CA 00 01", "GET UID / wallet id", "uid bytes + 90 00"],
          ["80 CA 00 02", "GET display name", "UTF-8 + 90 00"],
          ["Anything else", "Unsupported", "6D 00"],
        ]}
        striped
      />
      <Text size="small" tone="secondary">
        Custom AID in the Fxxxxx proprietary range, e.g. F00154415001
        (“TAP”). Never claim Visa/Mastercard AIDs.
      </Text>

      <H2>Hardware notes (Android)</H2>
      <Callout tone="warning" title="OEM skins can fight a background reader">
        Keep the merchant screen in the foreground with{" "}
        <Code>FLAG_KEEP_SCREEN_ON</Code>. Test long-running{" "}
        <Code>enableReaderMode</Code> sessions on real Android phones early
        (Pixel, Samsung, vivo/iQOO, Xiaomi, OnePlus, etc.), not the night
        before judging. Some OEM skins have broken stable NFC reader sessions.
        Do not assume stock-Android NFC behavior on every device.
      </Callout>
      <Text>
        Target is any Android phone with NFC reader mode. No vendor-specific
        NFC SDK. iOS is out of scope for now. A cheap NTAG213/215 wristband
        plus two Android phones is enough to demo.
      </Text>
      <Text>
        Confirm each demo phone can both read and write NDEF before you design
        around DESFire. Put a mock <Code>NfcAdapter</Code> behind the same API
        so UI work does not need a tag.
      </Text>

      <CollapsibleSection title="Libraries - do not write NFC from scratch" defaultOpen>
        <Table
          framed={false}
          headers={["Library", "NDEF", "IsoDep", "HCE", "Fit"]}
          rows={[
            ["react-native-nfc-manager", "Yes", "Yes", "Yes (Android)", "Best"],
            ["Flutter nfc_manager", "Yes", "Yes", "No (extra pkg)", "Good"],
            ["nfc_pro_manager (Flutter)", "Limited", "Yes", "Yes", "Heavier"],
            ["Native Kotlin only", "Yes", "Yes", "Yes", "Slow UI"],
          ]}
        />
      </CollapsibleSection>
    </Stack>
  );
}

function StackTab() {
  return (
    <Stack gap={20}>
      <Callout tone="success" title="Decision: React Native (Expo Dev Client) + Cloud Firestore">
        One APK, User / Merchant / Admin role switch. react-native-nfc-manager
        covers NDEF and IsoDep for the physical-tag MVP. HCE is in the same
        library but it is strictly P2. Firestore gives atomic deduct and live
        listeners without writing a backend.
      </Callout>

      <H2>Why React Native over Flutter</H2>
      <Text>
        Flutter NFC is fine for NDEF, which is what the MVP actually needs.
        HCE would need extra glue on Flutter, and we are not counting on HCE
        anyway. For an Android-first demo, one library plus the Firebase JS
        SDK is fewer moving parts. If the team already thinks in Dart, Flutter
        is still viable. Do not rewrite mid-event.
      </Text>

      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Hackathon fit score (0–10, judgment)</H3>
          <Text size="small" tone="secondary">
            Higher is better for this build. Scored from library docs and
            Android HCE constraints for an Android-only NFC pay demo.
          </Text>
          <BarChart
            height={220}
            categories={["NDEF speed", "IsoDep", "HCE", "UI speed", "Firebase"]}
            series={[
              { name: "React Native + RN NFC Manager", data: [9, 8, 8, 9, 9] },
              { name: "Flutter + nfc_manager", data: [9, 8, 4, 8, 7] },
            ]}
            yMax={10}
            showValues
          />
        </Stack>
        <Stack gap={8}>
          <H3>Balance store: atomic deduct vs live UI</H3>
          <Text size="small" tone="secondary">
            Scores 0–10. Firestore wins deduct correctness; RTDB wins raw
            pub/sub; Supabase is SQL-nice but more setup.
          </Text>
          <BarChart
            height={220}
            categories={["Atomic pay", "Realtime UI", "Auth", "Setup time", "Offline"]}
            series={[
              { name: "Cloud Firestore", data: [9, 8, 9, 8, 7] },
              { name: "Realtime Database", data: [5, 10, 9, 9, 8] },
              { name: "Supabase", data: [8, 8, 8, 6, 6] },
            ]}
            yMax={10}
          />
        </Stack>
      </Grid>

      <H2>Lock this stack</H2>
      <Table
        headers={["Layer", "Pick", "Why"]}
        rows={[
          ["App", "Expo + prebuild / Dev Client", "NFC is native; Expo Go is not enough"],
          ["NFC", "react-native-nfc-manager", "NDEF + IsoDep for tags; HCE is P2 only"],
          ["State / pay", "Cloud Firestore transactions", "balance -= amount if sufficient"],
          ["Live UI", "onSnapshot on wallet + txns", "User and merchant stay in sync"],
          ["Auth", "Anonymous + display name", "No SMS OTP in a noisy hall"],
          ["Top-up", "Fake UPI sheet", "Do not integrate a real PSP"],
          ["Fraud", "Tiny TFLite or JS model", "Tabular features, not a vision net"],
          ["Admin", "Same app, third role", "Skip a separate web panel"],
        ]}
        striped
      />

      <H2>Expo / Android flags you will need</H2>
      <Table
        headers={["Item", "Value"]}
        rows={[
          ["Permission", "android.permission.NFC"],
          ["Feature", "android.hardware.nfc (required=true for merchant)"],
          ["HCE feature", "android.hardware.nfc.hce required=false; skip until P2"],
          ["minSdk", "26+ is enough for reader mode"],
          ["Keep awake", "FLAG_KEEP_SCREEN_ON on the merchant screen, always"],
          ["Config plugin", "react-native-nfc-manager; HCE XML only if P2 is live"],
        ]}
        striped
      />

      <H2>Folder shape when you build</H2>
      <Text>
        Single app: <Code>app/user</Code>, <Code>app/merchant</Code>,{" "}
        <Code>app/admin</Code>, <Code>src/nfc</Code>, <Code>src/wallet</Code>,{" "}
        <Code>src/fraud</Code>. Mock NFC behind the same functions as the real
        adapter.
      </Text>
    </Stack>
  );
}

function Data() {
  return (
    <Stack gap={20}>
      <H2>Firestore shape</H2>
      <Table
        headers={["Collection", "Key", "Fields"]}
        rows={[
          ["tags", "uid hex", "userId, status (active|frozen), ndefVersion, hmac, createdAt"],
          ["wallets", "uid hex", "balancePaise, updatedAt, lastMerchantId"],
          ["txns", "auto id", "uid, merchantId, amountPaise, type (load|pay|refund), status, fraudScore, createdAt"],
          ["merchants", "id", "name, stall, deviceId"],
          ["users", "auth uid", "displayName, tagUids[]"],
        ]}
        striped
      />
      <Text size="small" tone="secondary">
        Store money as integer paise. Never floats. Deduct inside a
        transaction: read wallet, abort if frozen or short, else increment and
        write the txn.
      </Text>
      <Callout tone="danger" title="Rules must gate deduct">
        Security rules must allow the deduct transaction only from a properly
        authenticated merchant-role session. Anonymous auth is fine for users
        loading balance and watching their wallet. The pay path needs a role
        check. Do not leave Firestore rules wide open because you are short on
        time. That is a real fail, not a demo shortcut.
      </Callout>

      <H2>Security model (honest, not bank-grade)</H2>
      <Table
        headers={["Threat", "MVP control"]}
        rows={[
          ["Cloned UID", "HMAC on NDEF + freeze in admin; UID is not secret"],
          ["Rewritten NDEF", "Server ignores tag balance; HMAC mismatch warns"],
          ["Double tap / race", "Firestore transaction + client debounce"],
          ["Overdraw", "Transaction abort; merchant sees insufficient"],
          ["Stolen phone as POS", "Merchant PIN or device binding later"],
          ["Open Firestore rules", "Merchant-role only for deduct; never test-mode open"],
          ["Hall Wi-Fi drop", "Queue on merchant device; never write balance to tag"],
        ]}
        rowTone={["warning", "warning", "success", "success", "info", "danger", "warning"]}
        striped
      />

      <H2>On-device fraud (NPU angle)</H2>
      <Callout tone="warning" title="CPU scorer first, NPU only if it loads">
        Ship a tiny tabular scorer that runs on CPU. That is the default demo
        path. QNN / Hexagon / LiteRT is an optional upgrade only if it loads
        cleanly on that phone. Do not bet the pitch on Qualcomm AI Hub or QNN
        compiling on a vendor skin the first night. CPU fallback is the default
        demo path. NPU is a nice-to-have if it works.
      </Callout>
      <Text>
        Some Snapdragon phones can run LiteRT / TFLite via QNN in principle.
        Treat that as extra credit. Do not over-claim NPU on stage unless you
        have seen inference succeed on the device you are holding.
      </Text>
      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Feature vector</H3>
          <Table
            framed={false}
            headers={["Feature", "Why"]}
            rows={[
              ["amount_paise", "Outlier vs stall mean"],
              ["minutes_since_last", "Velocity"],
              ["taps_last_2min", "Burst / cloned tag"],
              ["hour_of_day", "Odd hours"],
              ["same_merchant_repeat", "Test taps vs real spend"],
              ["balance_ratio", "Drain-to-zero pattern"],
            ]}
          />
        </Stack>
        <Stack gap={8}>
          <H3>Outputs</H3>
          <Text size="small">
            Score 0–1. Below threshold: silent allow. Mid: merchant warning,
            still pay. High: block and show “anomaly - try again / staff.” Log
            score on the txn so the admin list looks intelligent.
          </Text>
          <BarChart
            height={180}
            horizontal
            categories={["Allow", "Warn", "Block"]}
            series={[{ name: "Example score bands", data: [0.45, 0.75, 1], tone: "warning" }]}
            valueSuffix=""
            yMax={1}
            showValues
          />
        </Stack>
      </Grid>
      <Text size="small" tone="secondary">
        Chart: example decision thresholds on a 0–1 anomaly score (not live
        production data). Allow &lt; 0.45, warn to 0.75, block above.
      </Text>

      <H2>Identity roadmap (same rails)</H2>
      <FlowChart
        nodeWidth={160}
        nodeHeight={54}
        nodes={[{ id: "a" }, { id: "b" }, { id: "c" }]}
        edges={[
          { from: "a", to: "b" },
          { from: "b", to: "c" },
        ]}
        labels={{
          a: { title: "Now", sub: "NFC tag UID" },
          b: { title: "Next", sub: "HCE phone wallet" },
          c: { title: "Later", sub: "Palm vein ID" },
        }}
      />
      <Text>
        Same merchant reader, same wallet, same fraud scorer. Only the identity
        probe changes.
      </Text>
    </Stack>
  );
}

function Pitch() {
  return (
    <Stack gap={20}>
      <H2>Judge demo path</H2>
      <Text size="small" tone="secondary">
        Ordered beats, not a timed agenda. Practice until this is boring.
      </Text>
      <Table
        headers={["Beat", "Action", "What they should feel"]}
        rows={[
          ["Hook", "Role switch → Merchant tap screen", "The phone IS the POS"],
          ["Load", "Load ₹500 on tag from User app", "Wonderla wristband"],
          ["Tap", "Tap tag on merchant Android phone, deduct ₹80", "Faster than UPI QR"],
          ["Proof", "Both screens update live", "Real-time, not a fake toast"],
          ["Edge", "Burst tap flagged or blocked", "On-device fraud / NPU story"],
          ["Vision", "Palm-vein one-liner + diagram", "Tag is disposable; protocol stays"],
        ]}
        striped
      />

      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Share of attention in the slot</H3>
          <Text size="small" tone="secondary">
            Relative weight of beats in a typical judging slot - not a clock.
          </Text>
          <PieChart
            donut
            size={220}
            data={[
              { label: "Hook + POS visual", value: 15, tone: "info" },
              { label: "Load + tap", value: 35, tone: "success" },
              { label: "Live sync proof", value: 20, tone: "neutral" },
              { label: "Fraud / NPU", value: 18, tone: "warning" },
              { label: "Palm-vein future", value: 12, tone: "danger" },
            ]}
          />
        </Stack>
        <Stack gap={8}>
          <H3>Spoken hook</H3>
          <Text>
            “UPI is a QR stare. Parks and campuses already solved this with
            wristbands. We put the terminal on the phone you already have.”
          </Text>
          <Text>
            Show merchant screen first (big tap target). Then user loads ₹500.
            Tap. Both phones tick. Fast second tap → velocity anomaly on
            device. End on: “Tag is a stand-in for a palm.”
          </Text>
        </Stack>
      </Grid>

      <H2>FinTech track framing</H2>
      <Grid columns={2} gap={16}>
        <Stack gap={8}>
          <H3>Why phone-first (Android)</H3>
          <Text>
            No extra POS dongle. Any Android phone with NFC can be the stall
            terminal. That is the product: the phone does the job of a
            machine, across vendors, not one flagship.
          </Text>
        </Stack>
        <Stack gap={8}>
          <H3>Real-world analogues</H3>
          <Text>
            Wonderla rechargeable bands, metro CSC/NCMC, college fests, food
            courts, stadiums. Same loop: prepaid identity + tap + ledger. You
            are not inventing payments - you are collapsing the terminal.
          </Text>
        </Stack>
      </Grid>

      <H2>Core features vs bonus</H2>
      <Table
        headers={["Must show", "Bonus if stable", "Do not start"]}
        rows={[
          ["Register tag + show UID", "HCE phone-as-tag", "Real UPI / PSP"],
          ["Load balance (mock UPI)", "Admin freeze + ledger", "Palm-vein hardware"],
          ["Merchant tap deduct", "IsoDep APDU theatre", "iOS app"],
          ["Live balance on both phones", "QNN NPU delegate", "Custom web dashboard"],
          ["Insufficient funds UI", "JS/TFLite fraud score", "Emulator-only demo"],
        ]}
        striped
      />

      <H2>Questions judges will poke</H2>
      <Table
        headers={["Question", "Honest answer"]}
        rows={[
          ["Is this UPI?", "No. Closed-loop prepaid. Top-up can be UPI later."],
          ["Can I clone the tag?", "UID + server HMAC. Freeze in admin. Not bank-grade."],
          ["Why not Paytm QR?", "Hands full, queues, kids/parks, sub-second tap."],
          ["Where is the NPU?", "CPU tabular scorer by default. QNN only if it actually loads."],
          ["iOS?", "Out of scope for now. Android NFC phones only."],
        ]}
        striped
      />

      <Callout tone="neutral" title="Backup if NFC flakes on stage">
        Keep a 20-second screen recording of a real tap, plus a “simulate tap”
        button on the merchant screen that runs the same Firestore path. Judges
        should still see live sync on the second phone.
      </Callout>
    </Stack>
  );
}

export default function TapPayPlan() {
  const [tab, setTab] = useCanvasState<TabId>("tappay-tab", "overview");

  return (
    <Stack gap={20}>
      <Stack gap={6}>
        <H1>TapPay architecture and stack</H1>
        <Text tone="secondary">
          Closed-loop NFC tap-to-pay. Merchant terminal is any Android phone
          with NFC. Tag is MVP identity. Planning only, no implementation in
          this artifact.
        </Text>
      </Stack>

      <Callout tone="warning" title="LOCKED MVP: TapPay">
        Must ship: Physical NTAG only (no HCE until later). Android phone as
        merchant terminal (reader mode). Cloud ledger (Firestore atomic
        deduct). Mock UPI top-up. CPU fraud score (NPU optional). One APK,
        three roles (User / Merchant / Admin). Live balance on both phones.
        Insufficient funds + freeze.
      </Callout>
      <Callout tone="danger" title="Out of scope until core works">
        Real UPI, HCE, iOS, separate admin web, balance-on-tag, NPU dependency.
      </Callout>

      <Row gap={8} wrap>
        {TABS.map((t) => (
          <span key={t.id}>
            <Pill active={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </Pill>
          </span>
        ))}
      </Row>

      <Divider />

      {tab === "overview" ? <Overview /> : null}
      {tab === "flow" ? <Flows /> : null}
      {tab === "nfc" ? <Nfc /> : null}
      {tab === "stack" ? <StackTab /> : null}
      {tab === "data" ? <Data /> : null}
      {tab === "pitch" ? <Pitch /> : null}
    </Stack>
  );
}
