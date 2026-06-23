const {
  computeNetBalances,
  simplifyDebts,
} = require("../../modules/balances/balances.service");

// ---------------------------------------------------------------------------
// computeNetBalances
// ---------------------------------------------------------------------------
describe("computeNetBalances", () => {
  it("single expense: payer credited, each participant debited their share", () => {
    const expenses = [
      {
        paidById: "alice",
        participants: [
          { userId: "alice", shareAmount: "30" },
          { userId: "bob", shareAmount: "30" },
          { userId: "charlie", shareAmount: "30" },
        ],
      },
    ];

    const result = computeNetBalances(expenses);

    // Alice paid 90, owes 30 herself → net +60
    expect(result["alice"]).toBeCloseTo(60);
    expect(result["bob"]).toBeCloseTo(-30);
    expect(result["charlie"]).toBeCloseTo(-30);
  });

  it("two symmetric expenses cancel out entirely", () => {
    const expenses = [
      {
        paidById: "alice",
        participants: [
          { userId: "alice", shareAmount: "50" },
          { userId: "bob", shareAmount: "50" },
        ],
      },
      {
        paidById: "bob",
        participants: [
          { userId: "alice", shareAmount: "50" },
          { userId: "bob", shareAmount: "50" },
        ],
      },
    ];

    const result = computeNetBalances(expenses);

    expect(result["alice"]).toBeCloseTo(0);
    expect(result["bob"]).toBeCloseTo(0);
  });

  it("payer not in participants is fully credited", () => {
    // Alice fronts $30; only Bob owes it
    const expenses = [
      {
        paidById: "alice",
        participants: [{ userId: "bob", shareAmount: "30" }],
      },
    ];

    const result = computeNetBalances(expenses);

    expect(result["alice"]).toBeCloseTo(30);
    expect(result["bob"]).toBeCloseTo(-30);
  });

  it("returns empty object for no expenses", () => {
    expect(computeNetBalances([])).toEqual({});
  });

  it("accumulates correctly across multiple expenses", () => {
    // Alice pays $20 for Bob; Bob pays $10 for Alice
    const expenses = [
      {
        paidById: "alice",
        participants: [{ userId: "bob", shareAmount: "20" }],
      },
      {
        paidById: "bob",
        participants: [{ userId: "alice", shareAmount: "10" }],
      },
    ];

    const result = computeNetBalances(expenses);

    expect(result["alice"]).toBeCloseTo(10); // +20 - 10
    expect(result["bob"]).toBeCloseTo(-10); // -20 + 10
  });
});

// ---------------------------------------------------------------------------
// simplifyDebts
// ---------------------------------------------------------------------------
describe("simplifyDebts", () => {
  it("two-person: produces a single transaction", () => {
    const debts = simplifyDebts({ alice: 30, bob: -30 });

    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({
      fromUserId: "bob",
      toUserId: "alice",
      amount: 30,
    });
  });

  it("three-person fan-in: two debtors pay one creditor", () => {
    const debts = simplifyDebts({ alice: 60, bob: -30, charlie: -30 });

    expect(debts).toHaveLength(2);
    debts.forEach((d) => expect(d.toUserId).toBe("alice"));
    const total = debts.reduce((s, d) => s + d.amount, 0);
    expect(total).toBeCloseTo(60);
  });

  it("chain A→B→C is reduced to A→C directly (1 transaction)", () => {
    // Alice owed $50 by Bob, who is owed $50 by Charlie
    // Net: alice +50, bob 0, charlie -50
    const debts = simplifyDebts({ alice: 50, bob: 0, charlie: -50 });

    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({
      fromUserId: "charlie",
      toUserId: "alice",
      amount: 50,
    });
  });

  it("cross-debts are netted: A owes B $30, B owes A $20 → B pays A $10", () => {
    const debts = simplifyDebts({ alice: 10, bob: -10 });

    expect(debts).toHaveLength(1);
    expect(debts[0]).toMatchObject({
      fromUserId: "bob",
      toUserId: "alice",
      amount: 10,
    });
  });

  it("returns empty array when all balances are zero", () => {
    expect(simplifyDebts({ alice: 0, bob: 0, charlie: 0 })).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(simplifyDebts({})).toEqual([]);
  });

  it("total payment amount is conserved after simplification", () => {
    // 4-person complex scenario
    const net = { a: 100, b: -30, c: -40, d: -30 };
    const debts = simplifyDebts(net);

    const total = debts.reduce((s, d) => s + d.amount, 0);
    expect(total).toBeCloseTo(100);
    // Greedy gives at most N-1 transactions
    expect(debts.length).toBeLessThanOrEqual(3);
  });

  it("handles a single creditor and many debtors", () => {
    const net = { alice: 90, bob: -30, charlie: -30, dave: -30 };
    const debts = simplifyDebts(net);

    expect(debts).toHaveLength(3);
    debts.forEach((d) => {
      expect(d.toUserId).toBe("alice");
      expect(d.amount).toBeCloseTo(30);
    });
  });
});

// ---------------------------------------------------------------------------
// computeNetBalances — with settlements
// ---------------------------------------------------------------------------
describe("computeNetBalances with settlements", () => {
  it("a full settlement zeroes out the debt between two users", () => {
    // Alice paid $60 for Bob → alice +60, bob -60
    const expenses = [
      {
        paidById: "alice",
        participants: [{ userId: "bob", shareAmount: "60" }],
      },
    ];
    // Bob settles $60 with Alice
    const settlements = [{ payerId: "bob", payeeId: "alice", amount: "60" }];

    const result = computeNetBalances(expenses, settlements);

    expect(result["alice"]).toBeCloseTo(0);
    expect(result["bob"]).toBeCloseTo(0);
  });

  it("a partial settlement reduces but does not eliminate the debt", () => {
    const expenses = [
      {
        paidById: "alice",
        participants: [{ userId: "bob", shareAmount: "90" }],
      },
    ];
    const settlements = [{ payerId: "bob", payeeId: "alice", amount: "40" }];

    const result = computeNetBalances(expenses, settlements);

    expect(result["alice"]).toBeCloseTo(50); // 90 - 40
    expect(result["bob"]).toBeCloseTo(-50); // -90 + 40
  });

  it("returns same result as no-settlement call when settlements array is empty", () => {
    const expenses = [
      {
        paidById: "alice",
        participants: [
          { userId: "alice", shareAmount: "30" },
          { userId: "bob", shareAmount: "30" },
        ],
      },
    ];

    expect(computeNetBalances(expenses, [])).toEqual(
      computeNetBalances(expenses),
    );
  });

  it("settlement from creditor to debtor increases creditor debt correctly", () => {
    // Alice owes Bob $50 (bob +50, alice -50)
    const expenses = [
      {
        paidById: "bob",
        participants: [{ userId: "alice", shareAmount: "50" }],
      },
    ];
    // Alice pays $50 → balance fully cleared
    const settlements = [{ payerId: "alice", payeeId: "bob", amount: "50" }];

    const result = computeNetBalances(expenses, settlements);

    expect(result["alice"]).toBeCloseTo(0);
    expect(result["bob"]).toBeCloseTo(0);
  });

  it("multiple settlements accumulate correctly", () => {
    // Alice pays $90 for everyone (3-way equal → each $30)
    const expenses = [
      {
        paidById: "alice",
        participants: [
          { userId: "alice", shareAmount: "30" },
          { userId: "bob", shareAmount: "30" },
          { userId: "charlie", shareAmount: "30" },
        ],
      },
    ];
    // bob pays $30, charlie pays $10 (partial)
    const settlements = [
      { payerId: "bob", payeeId: "alice", amount: "30" },
      { payerId: "charlie", payeeId: "alice", amount: "10" },
    ];

    const result = computeNetBalances(expenses, settlements);

    // alice: +60 (from expense) - 30 (bob's payment) - 10 (charlie's payment) = +20
    expect(result["alice"]).toBeCloseTo(20);
    expect(result["bob"]).toBeCloseTo(0); // -30 + 30
    expect(result["charlie"]).toBeCloseTo(-20); // -30 + 10
  });
});
