const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

async function main() {
  console.log("🌱 Starting seed...");

  // Clean tables in FK-safe order
  await prisma.settlement.deleteMany();
  await prisma.debt.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // --------------------------------------------------------------------------
  // Users
  // --------------------------------------------------------------------------
  const hashedPassword = await bcryptjs.hash("password123", SALT_ROUNDS);

  const [user1, user2, user3, user4, user5] = await Promise.all([
    prisma.user.create({
      data: {
        email: "john@example.com",
        name: "John Doe",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "jane@example.com",
        name: "Jane Smith",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "bob@example.com",
        name: "Bob Johnson",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "alice@example.com",
        name: "Alice Brown",
        password: hashedPassword,
      },
    }),
    prisma.user.create({
      data: {
        email: "charlie@example.com",
        name: "Charlie Wilson",
        password: hashedPassword,
      },
    }),
  ]);

  // --------------------------------------------------------------------------
  // Groups
  // --------------------------------------------------------------------------
  const [aptGroup, vacGroup, lunchGroup, tripGroup, renovGroup] =
    await Promise.all([
      prisma.group.create({
        data: {
          name: "Apartment Expenses",
          description:
            "Shared apartment costs — 3 members, EQUAL + EXACT splits",
        },
      }),
      prisma.group.create({
        data: {
          name: "Vacation Trip",
          description: "Beach trip — 2 members, EXACT + EQUAL, multiple payers",
        },
      }),
      prisma.group.create({
        data: {
          name: "Work Lunches",
          description: "Team lunches — 4 members, EQUAL + PERCENTAGE + EXACT",
        },
      }),
      prisma.group.create({
        data: {
          name: "Road Trip",
          description: "Weekend road trip — 4 members, complex mixed splits",
        },
      }),
      prisma.group.create({
        data: {
          name: "House Renovation",
          description:
            "Renovation costs — 4 members, large amounts, settled debt",
        },
      }),
    ]);

  // --------------------------------------------------------------------------
  // Group members
  // --------------------------------------------------------------------------
  await prisma.groupMember.createMany({
    data: [
      // Apartment: John, Jane, Bob
      { userId: user1.id, groupId: aptGroup.id },
      { userId: user2.id, groupId: aptGroup.id },
      { userId: user3.id, groupId: aptGroup.id },
      // Vacation: John, Jane
      { userId: user1.id, groupId: vacGroup.id },
      { userId: user2.id, groupId: vacGroup.id },
      // Work Lunches: John, Jane, Bob, Alice
      { userId: user1.id, groupId: lunchGroup.id },
      { userId: user2.id, groupId: lunchGroup.id },
      { userId: user3.id, groupId: lunchGroup.id },
      { userId: user4.id, groupId: lunchGroup.id },
      // Road Trip: John, Bob, Alice, Charlie
      { userId: user1.id, groupId: tripGroup.id },
      { userId: user3.id, groupId: tripGroup.id },
      { userId: user4.id, groupId: tripGroup.id },
      { userId: user5.id, groupId: tripGroup.id },
      // House Renovation: John, Jane, Alice, Charlie
      { userId: user1.id, groupId: renovGroup.id },
      { userId: user2.id, groupId: renovGroup.id },
      { userId: user4.id, groupId: renovGroup.id },
      { userId: user5.id, groupId: renovGroup.id },
    ],
  });

  // ==========================================================================
  // GROUP 1 — Apartment Expenses
  // Members: John(1), Jane(2), Bob(3)
  // Payers: John pays 2 expenses, Jane pays 1, Bob pays 1
  // Split types: EQUAL and EXACT
  //
  // Expected net balances:
  //   John  +$30   Jane  +$10   Bob  -$40
  // ==========================================================================

  // $90 — Groceries — paid John — EQUAL (3 ways → $30 each)
  // Debts: Jane→John $30, Bob→John $30
  const aptExp1 = await prisma.expense.create({
    data: {
      description: "Groceries",
      amount: 90.0,
      paidById: user1.id,
      groupId: aptGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 30.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 30.0, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 30.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $120 — Electricity — paid Jane — EQUAL (3 ways → $40 each)
  // Debts: John→Jane $40, Bob→Jane $40
  const aptExp2 = await prisma.expense.create({
    data: {
      description: "Electricity bill",
      amount: 120.0,
      paidById: user2.id,
      groupId: aptGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 40.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 40.0, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 40.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $60 — Internet — paid Bob — EQUAL (3 ways → $20 each)
  // Debts: John→Bob $20, Jane→Bob $20
  const aptExp3 = await prisma.expense.create({
    data: {
      description: "Internet",
      amount: 60.0,
      paidById: user3.id,
      groupId: aptGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 20.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 20.0, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 20.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $45 — Cleaning supplies — paid John — EXACT (unequal shares)
  // Debts: Jane→John $20, Bob→John $10
  const aptExp4 = await prisma.expense.create({
    data: {
      description: "Cleaning supplies",
      amount: 45.0,
      paidById: user1.id,
      groupId: aptGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 15.0, splitType: "EXACT" },
          { userId: user2.id, shareAmount: 20.0, splitType: "EXACT" },
          { userId: user3.id, shareAmount: 10.0, splitType: "EXACT" },
        ],
      },
    },
  });

  // Debts
  const aptDebt_u2_u1_exp1 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user2.id,
      amount: 30.0,
      groupId: aptGroup.id,
      expenseId: aptExp1.id,
    },
  });
  const aptDebt_u3_u1_exp1 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user3.id,
      amount: 30.0,
      groupId: aptGroup.id,
      expenseId: aptExp1.id,
    },
  });
  await prisma.debt.createMany({
    data: [
      {
        creditorId: user2.id,
        debtorId: user1.id,
        amount: 40.0,
        groupId: aptGroup.id,
        expenseId: aptExp2.id,
      },
      {
        creditorId: user2.id,
        debtorId: user3.id,
        amount: 40.0,
        groupId: aptGroup.id,
        expenseId: aptExp2.id,
      },
      {
        creditorId: user3.id,
        debtorId: user1.id,
        amount: 20.0,
        groupId: aptGroup.id,
        expenseId: aptExp3.id,
      },
      {
        creditorId: user3.id,
        debtorId: user2.id,
        amount: 20.0,
        groupId: aptGroup.id,
        expenseId: aptExp3.id,
      },
      {
        creditorId: user1.id,
        debtorId: user2.id,
        amount: 20.0,
        groupId: aptGroup.id,
        expenseId: aptExp4.id,
      },
      {
        creditorId: user1.id,
        debtorId: user3.id,
        amount: 10.0,
        groupId: aptGroup.id,
        expenseId: aptExp4.id,
      },
    ],
  });

  // Settlement: Bob partially pays John $20
  await prisma.settlement.create({
    data: {
      payerId: user3.id,
      payeeId: user1.id,
      amount: 20.0,
      notes: "Partial payment for groceries",
      groupId: aptGroup.id,
      debts: { connect: [{ id: aptDebt_u3_u1_exp1.id }] },
    },
  });

  // ==========================================================================
  // GROUP 2 — Vacation Trip
  // Members: John(1), Jane(2)
  // Payers: John pays 2 expenses ($280 total), Jane pays 2 ($420 total)
  // Split types: EXACT and EQUAL
  //
  // Expected net balances (from expenses only):
  //   John  -$70   Jane  +$70
  // The settlement records a net payment but does NOT affect balance calc.
  // ==========================================================================

  // $200 — Hotel — paid John — EXACT ($100 each)
  // Debt: Jane→John $100
  const vacExp1 = await prisma.expense.create({
    data: {
      description: "Hotel",
      amount: 200.0,
      paidById: user1.id,
      groupId: vacGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 100.0, splitType: "EXACT" },
          { userId: user2.id, shareAmount: 100.0, splitType: "EXACT" },
        ],
      },
    },
  });

  // $300 — Flights — paid Jane — EXACT ($150 each)
  // Debt: John→Jane $150
  const vacExp2 = await prisma.expense.create({
    data: {
      description: "Flights",
      amount: 300.0,
      paidById: user2.id,
      groupId: vacGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 150.0, splitType: "EXACT" },
          { userId: user2.id, shareAmount: 150.0, splitType: "EXACT" },
        ],
      },
    },
  });

  // $80 — Restaurants — paid John — EQUAL ($40 each)
  // Debt: Jane→John $40
  const vacExp3 = await prisma.expense.create({
    data: {
      description: "Restaurants",
      amount: 80.0,
      paidById: user1.id,
      groupId: vacGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 40.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 40.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $120 — Car rental — paid Jane — EQUAL ($60 each)
  // Debt: John→Jane $60
  const vacExp4 = await prisma.expense.create({
    data: {
      description: "Car rental",
      amount: 120.0,
      paidById: user2.id,
      groupId: vacGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 60.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 60.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  const vacDebt_u2_u1_exp1 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user2.id,
      amount: 100.0,
      groupId: vacGroup.id,
      expenseId: vacExp1.id,
    },
  });
  const vacDebt_u1_u2_exp2 = await prisma.debt.create({
    data: {
      creditorId: user2.id,
      debtorId: user1.id,
      amount: 150.0,
      groupId: vacGroup.id,
      expenseId: vacExp2.id,
    },
  });
  await prisma.debt.createMany({
    data: [
      {
        creditorId: user1.id,
        debtorId: user2.id,
        amount: 40.0,
        groupId: vacGroup.id,
        expenseId: vacExp3.id,
      },
      {
        creditorId: user2.id,
        debtorId: user1.id,
        amount: 60.0,
        groupId: vacGroup.id,
        expenseId: vacExp4.id,
      },
    ],
  });

  // Settlement: John pays Jane the $70 net
  await prisma.settlement.create({
    data: {
      payerId: user1.id,
      payeeId: user2.id,
      amount: 70.0,
      notes: "Settling vacation balance in full",
      groupId: vacGroup.id,
      debts: { connect: [{ id: vacDebt_u1_u2_exp2.id }] },
    },
  });

  // ==========================================================================
  // GROUP 3 — Work Lunches
  // Members: John(1), Jane(2), Bob(3), Alice(4)
  // Payers: each member pays one expense
  // Split types: EQUAL, PERCENTAGE, EXACT
  //
  // Expected net balances:
  //   John  -$27.50   Jane  +$62.50   Bob  -$47.50   Alice  +$12.50
  // ==========================================================================

  // $100 — Team lunch — paid John — EQUAL (4 ways → $25 each)
  // Debts: Jane→John $25, Bob→John $25, Alice→John $25
  const lunchExp1 = await prisma.expense.create({
    data: {
      description: "Team lunch",
      amount: 100.0,
      paidById: user1.id,
      groupId: lunchGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 25.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 25.0, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 25.0, splitType: "EQUAL" },
          { userId: user4.id, shareAmount: 25.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $200 — Conference dinner — paid Jane — PERCENTAGE (30%/40%/20%/10%)
  // Shares: John $60, Jane $80, Bob $40, Alice $20
  // Debts: John→Jane $60, Bob→Jane $40, Alice→Jane $20
  const lunchExp2 = await prisma.expense.create({
    data: {
      description: "Conference dinner",
      amount: 200.0,
      paidById: user2.id,
      groupId: lunchGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 60.0, splitType: "PERCENTAGE" },
          { userId: user2.id, shareAmount: 80.0, splitType: "PERCENTAGE" },
          { userId: user3.id, shareAmount: 40.0, splitType: "PERCENTAGE" },
          { userId: user4.id, shareAmount: 20.0, splitType: "PERCENTAGE" },
        ],
      },
    },
  });

  // $50 — Coffee runs — paid Bob — EQUAL (4 ways → $12.50 each)
  // Debts: John→Bob $12.50, Jane→Bob $12.50, Alice→Bob $12.50
  const lunchExp3 = await prisma.expense.create({
    data: {
      description: "Coffee runs",
      amount: 50.0,
      paidById: user3.id,
      groupId: lunchGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 12.5, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 12.5, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 12.5, splitType: "EQUAL" },
          { userId: user4.id, shareAmount: 12.5, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $80 — Office supplies — paid Alice — EXACT (unequal)
  // Shares: John $30, Jane $20, Bob $20, Alice $10
  // Debts: John→Alice $30, Jane→Alice $20, Bob→Alice $20
  const lunchExp4 = await prisma.expense.create({
    data: {
      description: "Office supplies",
      amount: 80.0,
      paidById: user4.id,
      groupId: lunchGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 30.0, splitType: "EXACT" },
          { userId: user2.id, shareAmount: 20.0, splitType: "EXACT" },
          { userId: user3.id, shareAmount: 20.0, splitType: "EXACT" },
          { userId: user4.id, shareAmount: 10.0, splitType: "EXACT" },
        ],
      },
    },
  });

  await prisma.debt.createMany({
    data: [
      {
        creditorId: user1.id,
        debtorId: user2.id,
        amount: 25.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp1.id,
      },
      {
        creditorId: user1.id,
        debtorId: user3.id,
        amount: 25.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp1.id,
      },
      {
        creditorId: user1.id,
        debtorId: user4.id,
        amount: 25.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp1.id,
      },
      {
        creditorId: user2.id,
        debtorId: user1.id,
        amount: 60.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp2.id,
      },
      {
        creditorId: user2.id,
        debtorId: user3.id,
        amount: 40.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp2.id,
      },
      {
        creditorId: user2.id,
        debtorId: user4.id,
        amount: 20.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp2.id,
      },
      {
        creditorId: user3.id,
        debtorId: user1.id,
        amount: 12.5,
        groupId: lunchGroup.id,
        expenseId: lunchExp3.id,
      },
      {
        creditorId: user3.id,
        debtorId: user2.id,
        amount: 12.5,
        groupId: lunchGroup.id,
        expenseId: lunchExp3.id,
      },
      {
        creditorId: user3.id,
        debtorId: user4.id,
        amount: 12.5,
        groupId: lunchGroup.id,
        expenseId: lunchExp3.id,
      },
      {
        creditorId: user4.id,
        debtorId: user1.id,
        amount: 30.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp4.id,
      },
      {
        creditorId: user4.id,
        debtorId: user2.id,
        amount: 20.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp4.id,
      },
      {
        creditorId: user4.id,
        debtorId: user3.id,
        amount: 20.0,
        groupId: lunchGroup.id,
        expenseId: lunchExp4.id,
      },
    ],
  });

  // ==========================================================================
  // GROUP 4 — Road Trip
  // Members: John(1), Bob(3), Alice(4), Charlie(5)
  // Payers: each member pays one expense
  // Split types: EQUAL, EXACT, PERCENTAGE
  //
  // Expected net balances:
  //   John  +$147.50   Bob  -$73.50   Alice  -$61.50   Charlie  -$12.50
  // ==========================================================================

  // $150 — Gas — paid Bob — EQUAL (4 ways → $37.50 each)
  // Debts: John→Bob $37.50, Alice→Bob $37.50, Charlie→Bob $37.50
  const tripExp1 = await prisma.expense.create({
    data: {
      description: "Gas",
      amount: 150.0,
      paidById: user3.id,
      groupId: tripGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 37.5, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 37.5, splitType: "EQUAL" },
          { userId: user4.id, shareAmount: 37.5, splitType: "EQUAL" },
          { userId: user5.id, shareAmount: 37.5, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $400 — Airbnb — paid John — EXACT (unequal shares)
  // Shares: John $120, Bob $100, Alice $100, Charlie $80
  // Debts: Bob→John $100, Alice→John $100, Charlie→John $80
  const tripExp2 = await prisma.expense.create({
    data: {
      description: "Airbnb",
      amount: 400.0,
      paidById: user1.id,
      groupId: tripGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 120.0, splitType: "EXACT" },
          { userId: user3.id, shareAmount: 100.0, splitType: "EXACT" },
          { userId: user4.id, shareAmount: 100.0, splitType: "EXACT" },
          { userId: user5.id, shareAmount: 80.0, splitType: "EXACT" },
        ],
      },
    },
  });

  // $200 — Food & drinks — paid Charlie — EQUAL (4 ways → $50 each)
  // Debts: John→Charlie $50, Bob→Charlie $50, Alice→Charlie $50
  const tripExp3 = await prisma.expense.create({
    data: {
      description: "Food & drinks",
      amount: 200.0,
      paidById: user5.id,
      groupId: tripGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 50.0, splitType: "EQUAL" },
          { userId: user3.id, shareAmount: 50.0, splitType: "EQUAL" },
          { userId: user4.id, shareAmount: 50.0, splitType: "EQUAL" },
          { userId: user5.id, shareAmount: 50.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $180 — Activities & tickets — paid Alice — PERCENTAGE (25%/20%/30%/25%)
  // Shares: John $45, Bob $36, Alice $54, Charlie $45
  // Debts: John→Alice $45, Bob→Alice $36, Charlie→Alice $45
  const tripExp4 = await prisma.expense.create({
    data: {
      description: "Activities & tickets",
      amount: 180.0,
      paidById: user4.id,
      groupId: tripGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 45.0, splitType: "PERCENTAGE" },
          { userId: user3.id, shareAmount: 36.0, splitType: "PERCENTAGE" },
          { userId: user4.id, shareAmount: 54.0, splitType: "PERCENTAGE" },
          { userId: user5.id, shareAmount: 45.0, splitType: "PERCENTAGE" },
        ],
      },
    },
  });

  await prisma.debt.createMany({
    data: [
      {
        creditorId: user3.id,
        debtorId: user1.id,
        amount: 37.5,
        groupId: tripGroup.id,
        expenseId: tripExp1.id,
      },
      {
        creditorId: user3.id,
        debtorId: user4.id,
        amount: 37.5,
        groupId: tripGroup.id,
        expenseId: tripExp1.id,
      },
      {
        creditorId: user3.id,
        debtorId: user5.id,
        amount: 37.5,
        groupId: tripGroup.id,
        expenseId: tripExp1.id,
      },
      {
        creditorId: user1.id,
        debtorId: user3.id,
        amount: 100.0,
        groupId: tripGroup.id,
        expenseId: tripExp2.id,
      },
      {
        creditorId: user1.id,
        debtorId: user4.id,
        amount: 100.0,
        groupId: tripGroup.id,
        expenseId: tripExp2.id,
      },
      {
        creditorId: user1.id,
        debtorId: user5.id,
        amount: 80.0,
        groupId: tripGroup.id,
        expenseId: tripExp2.id,
      },
      {
        creditorId: user5.id,
        debtorId: user1.id,
        amount: 50.0,
        groupId: tripGroup.id,
        expenseId: tripExp3.id,
      },
      {
        creditorId: user5.id,
        debtorId: user3.id,
        amount: 50.0,
        groupId: tripGroup.id,
        expenseId: tripExp3.id,
      },
      {
        creditorId: user5.id,
        debtorId: user4.id,
        amount: 50.0,
        groupId: tripGroup.id,
        expenseId: tripExp3.id,
      },
      {
        creditorId: user4.id,
        debtorId: user1.id,
        amount: 45.0,
        groupId: tripGroup.id,
        expenseId: tripExp4.id,
      },
      {
        creditorId: user4.id,
        debtorId: user3.id,
        amount: 36.0,
        groupId: tripGroup.id,
        expenseId: tripExp4.id,
      },
      {
        creditorId: user4.id,
        debtorId: user5.id,
        amount: 45.0,
        groupId: tripGroup.id,
        expenseId: tripExp4.id,
      },
    ],
  });

  // ==========================================================================
  // GROUP 5 — House Renovation
  // Members: John(1), Jane(2), Alice(4), Charlie(5)
  // Payers: each member pays one expense (large amounts)
  // Split types: EQUAL, EXACT, PERCENTAGE
  //
  // Expected net balances:
  //   John  +$430   Jane  +$90   Alice  -$410   Charlie  -$110
  // One debt (Alice→John $300 from materials) is settled via settlement.
  // After settlement, outstanding: John +$130, Jane +$90, Alice -$110, Charlie -$110
  // ==========================================================================

  // $1200 — Building materials — paid John — EQUAL (4 ways → $300 each)
  // Debts: Jane→John $300, Alice→John $300, Charlie→John $300
  const renovExp1 = await prisma.expense.create({
    data: {
      description: "Building materials",
      amount: 1200.0,
      paidById: user1.id,
      groupId: renovGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 300.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 300.0, splitType: "EQUAL" },
          { userId: user4.id, shareAmount: 300.0, splitType: "EQUAL" },
          { userId: user5.id, shareAmount: 300.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $800 — Labor costs — paid Jane — EXACT ($200 each)
  // Debts: John→Jane $200, Alice→Jane $200, Charlie→Jane $200
  const renovExp2 = await prisma.expense.create({
    data: {
      description: "Labor costs",
      amount: 800.0,
      paidById: user2.id,
      groupId: renovGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 200.0, splitType: "EXACT" },
          { userId: user2.id, shareAmount: 200.0, splitType: "EXACT" },
          { userId: user4.id, shareAmount: 200.0, splitType: "EXACT" },
          { userId: user5.id, shareAmount: 200.0, splitType: "EXACT" },
        ],
      },
    },
  });

  // $240 — Tools & equipment — paid Alice — EQUAL (4 ways → $60 each)
  // Debts: John→Alice $60, Jane→Alice $60, Charlie→Alice $60
  const renovExp3 = await prisma.expense.create({
    data: {
      description: "Tools & equipment",
      amount: 240.0,
      paidById: user4.id,
      groupId: renovGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 60.0, splitType: "EQUAL" },
          { userId: user2.id, shareAmount: 60.0, splitType: "EQUAL" },
          { userId: user4.id, shareAmount: 60.0, splitType: "EQUAL" },
          { userId: user5.id, shareAmount: 60.0, splitType: "EQUAL" },
        ],
      },
    },
  });

  // $600 — Furniture — paid Charlie — PERCENTAGE (35%/25%/15%/25%)
  // Shares: John $210, Jane $150, Alice $90, Charlie $150
  // Debts: John→Charlie $210, Jane→Charlie $150, Alice→Charlie $90
  const renovExp4 = await prisma.expense.create({
    data: {
      description: "Furniture",
      amount: 600.0,
      paidById: user5.id,
      groupId: renovGroup.id,
      participants: {
        create: [
          { userId: user1.id, shareAmount: 210.0, splitType: "PERCENTAGE" },
          { userId: user2.id, shareAmount: 150.0, splitType: "PERCENTAGE" },
          { userId: user4.id, shareAmount: 90.0, splitType: "PERCENTAGE" },
          { userId: user5.id, shareAmount: 150.0, splitType: "PERCENTAGE" },
        ],
      },
    },
  });

  const renovDebt_u4_u1 = await prisma.debt.create({
    data: {
      creditorId: user1.id,
      debtorId: user4.id,
      amount: 300.0,
      groupId: renovGroup.id,
      expenseId: renovExp1.id,
    },
  });
  await prisma.debt.createMany({
    data: [
      {
        creditorId: user1.id,
        debtorId: user2.id,
        amount: 300.0,
        groupId: renovGroup.id,
        expenseId: renovExp1.id,
      },
      {
        creditorId: user1.id,
        debtorId: user5.id,
        amount: 300.0,
        groupId: renovGroup.id,
        expenseId: renovExp1.id,
      },
      {
        creditorId: user2.id,
        debtorId: user1.id,
        amount: 200.0,
        groupId: renovGroup.id,
        expenseId: renovExp2.id,
      },
      {
        creditorId: user2.id,
        debtorId: user4.id,
        amount: 200.0,
        groupId: renovGroup.id,
        expenseId: renovExp2.id,
      },
      {
        creditorId: user2.id,
        debtorId: user5.id,
        amount: 200.0,
        groupId: renovGroup.id,
        expenseId: renovExp2.id,
      },
      {
        creditorId: user4.id,
        debtorId: user1.id,
        amount: 60.0,
        groupId: renovGroup.id,
        expenseId: renovExp3.id,
      },
      {
        creditorId: user4.id,
        debtorId: user2.id,
        amount: 60.0,
        groupId: renovGroup.id,
        expenseId: renovExp3.id,
      },
      {
        creditorId: user4.id,
        debtorId: user5.id,
        amount: 60.0,
        groupId: renovGroup.id,
        expenseId: renovExp3.id,
      },
      {
        creditorId: user5.id,
        debtorId: user1.id,
        amount: 210.0,
        groupId: renovGroup.id,
        expenseId: renovExp4.id,
      },
      {
        creditorId: user5.id,
        debtorId: user2.id,
        amount: 150.0,
        groupId: renovGroup.id,
        expenseId: renovExp4.id,
      },
      {
        creditorId: user5.id,
        debtorId: user4.id,
        amount: 90.0,
        groupId: renovGroup.id,
        expenseId: renovExp4.id,
      },
    ],
  });

  // Settlement: Alice pays John $300 (full materials debt, marked as settled)
  await prisma.settlement.create({
    data: {
      payerId: user4.id,
      payeeId: user1.id,
      amount: 300.0,
      notes: "Alice paying John back for building materials",
      groupId: renovGroup.id,
      debts: { connect: [{ id: renovDebt_u4_u1.id }] },
    },
  });
  await prisma.debt.update({
    where: { id: renovDebt_u4_u1.id },
    data: { isSettled: true },
  });

  console.log("✅ Seed completed successfully");
  console.log("");
  console.log("👤 Users (all passwords: password123)");
  console.log("   john@example.com | jane@example.com | bob@example.com");
  console.log("   alice@example.com | charlie@example.com");
  console.log("");
  console.log("📊 Expected net balances per group (computed from expenses):");
  console.log("   Apartment  : John +$30,     Jane +$10,    Bob -$40");
  console.log(
    "   Vacation   : John -$70,     Jane +$70     (settlement recorded, balance unchanged)",
  );
  console.log(
    "   Work Lunches: John -$27.50, Jane +$62.50, Bob -$47.50, Alice +$12.50",
  );
  console.log(
    "   Road Trip  : John +$147.50, Bob -$73.50,  Alice -$61.50, Charlie -$12.50",
  );
  console.log(
    "   Renovation : John +$430,    Jane +$90,    Alice -$410,   Charlie -$110",
  );
  console.log(
    "                (Alice→John $300 debt is isSettled=true for settlements testing)",
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
