import { getDb, transaction } from './index.js';
import bcrypt from 'bcryptjs';

export function seedDatabase() {
    const db = getDb();

    // Check if already seeded
    const existingUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (existingUsers.count > 0) {
        console.log('Database already seeded');
        return;
    }

    transaction(() => {
        const passwordHash = bcrypt.hashSync('password123', 10);

        // Create users
        const insertUser = db.prepare(`
      INSERT INTO users (name, email, password_hash, default_currency, subscription_status, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

        insertUser.run('Sidharth', 'sidharth@example.com', passwordHash, 'GBP', 'Pro', null);
        insertUser.run('Shahaba', 'shahaba@example.com', passwordHash, 'GBP', 'Free', null);
        insertUser.run('Sruthy M.', 'sruthy@example.com', passwordHash, 'GBP', 'Free', null);
        insertUser.run('Alex Chen', 'alex@example.com', passwordHash, 'USD', 'Free', null);
        insertUser.run('Priya Sharma', 'priya@example.com', passwordHash, 'INR', 'Pro', null);

        // Create groups
        const insertGroup = db.prepare(`
      INSERT INTO groups (name, created_by, cover_photo_url)
      VALUES (?, ?, ?)
    `);

        insertGroup.run('Oxodonia Flat', 1, null);
        insertGroup.run('Weekend Trip', 1, null);
        insertGroup.run('Office Lunch', 2, null);

        // Add group members
        const insertMember = db.prepare(`
      INSERT INTO group_members (group_id, user_id)
      VALUES (?, ?)
    `);

        // Oxodonia Flat: Sidharth, Shahaba, Sruthy
        insertMember.run(1, 1);
        insertMember.run(1, 2);
        insertMember.run(1, 3);

        // Weekend Trip: Sidharth, Alex, Priya
        insertMember.run(2, 1);
        insertMember.run(2, 4);
        insertMember.run(2, 5);

        // Office Lunch: Shahaba, Sruthy, Alex
        insertMember.run(3, 2);
        insertMember.run(3, 3);
        insertMember.run(3, 4);

        // Create expenses
        const insertExpense = db.prepare(`
      INSERT INTO expenses (group_id, payer_id, amount, currency, description, date, category)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

        const insertSplit = db.prepare(`
      INSERT INTO expense_splits (expense_id, user_id, owed_share)
      VALUES (?, ?, ?)
    `);

        const insertDebt = db.prepare(`
      INSERT INTO debts (payer_id, payee_id, amount, group_id)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(payer_id, payee_id, group_id) DO UPDATE SET amount = amount + excluded.amount
    `);

        // Helper to normalize debt direction
        function addDebt(fromUser, toUser, amount, groupId) {
            if (fromUser === toUser) return;
            const [p1, p2] = fromUser < toUser ? [fromUser, toUser] : [toUser, fromUser];
            const adj = fromUser < toUser ? amount : -amount;
            insertDebt.run(p1, p2, adj, groupId);
        }

        // Expense 1: Groceries (Sidharth paid £120, split 3 ways in Oxodonia)
        let expId = insertExpense.run(1, 1, 120, 'GBP', 'Weekly Groceries', '2024-12-20', 'Groceries').lastInsertRowid;
        insertSplit.run(expId, 1, 40);
        insertSplit.run(expId, 2, 40);
        insertSplit.run(expId, 3, 40);
        addDebt(2, 1, 40, 1); // Shahaba owes Sidharth
        addDebt(3, 1, 40, 1); // Sruthy owes Sidharth

        // Expense 2: Internet Bill (Shahaba paid £60, split 3 ways)
        expId = insertExpense.run(1, 2, 60, 'GBP', 'Internet Bill December', '2024-12-15', 'Utilities').lastInsertRowid;
        insertSplit.run(expId, 1, 20);
        insertSplit.run(expId, 2, 20);
        insertSplit.run(expId, 3, 20);
        addDebt(1, 2, 20, 1); // Sidharth owes Shahaba
        addDebt(3, 2, 20, 1); // Sruthy owes Shahaba

        // Expense 3: Uber (Sruthy paid £24, split 3 ways)
        expId = insertExpense.run(1, 3, 24, 'GBP', 'Uber to IKEA', '2024-12-18', 'Transport').lastInsertRowid;
        insertSplit.run(expId, 1, 8);
        insertSplit.run(expId, 2, 8);
        insertSplit.run(expId, 3, 8);
        addDebt(1, 3, 8, 1);
        addDebt(2, 3, 8, 1);

        // Expense 4: Restaurant (Sidharth paid £150, split 3 ways for Weekend Trip)
        expId = insertExpense.run(2, 1, 150, 'GBP', 'Dinner at The Oak', '2024-12-22', 'Food').lastInsertRowid;
        insertSplit.run(expId, 1, 50);
        insertSplit.run(expId, 4, 50);
        insertSplit.run(expId, 5, 50);
        addDebt(4, 1, 50, 2); // Alex owes Sidharth
        addDebt(5, 1, 50, 2); // Priya owes Sidharth (but 1 < 5, so store as 1,5)

        // Expense 5: Hotel (Alex paid £300, split 3 ways)
        expId = insertExpense.run(2, 4, 300, 'GBP', 'Hotel 2 nights', '2024-12-21', 'Accommodation').lastInsertRowid;
        insertSplit.run(expId, 1, 100);
        insertSplit.run(expId, 4, 100);
        insertSplit.run(expId, 5, 100);
        addDebt(1, 4, 100, 2); // Sidharth owes Alex
        addDebt(5, 4, 100, 2); // Priya owes Alex (but 4 < 5)

        // Expense 6: Office lunch (Shahaba paid £45)
        expId = insertExpense.run(3, 2, 45, 'GBP', 'Team Lunch', '2024-12-23', 'Food').lastInsertRowid;
        insertSplit.run(expId, 2, 15);
        insertSplit.run(expId, 3, 15);
        insertSplit.run(expId, 4, 15);
        addDebt(3, 2, 15, 3); // Sruthy owes Shahaba (2 < 3)
        addDebt(4, 2, 15, 3); // Alex owes Shahaba (2 < 4)

        // Add some activity logs
        const insertActivity = db.prepare(`
      INSERT INTO activity_log (user_id, action_type, target_type, target_id, description)
      VALUES (?, ?, ?, ?, ?)
    `);

        insertActivity.run(1, 'create', 'expense', 1, 'added "Weekly Groceries" in Oxodonia Flat');
        insertActivity.run(2, 'create', 'expense', 2, 'added "Internet Bill December" in Oxodonia Flat');
        insertActivity.run(3, 'create', 'expense', 3, 'added "Uber to IKEA" in Oxodonia Flat');
        insertActivity.run(1, 'create', 'expense', 4, 'added "Dinner at The Oak" in Weekend Trip');
        insertActivity.run(4, 'create', 'expense', 5, 'added "Hotel 2 nights" in Weekend Trip');
        insertActivity.run(2, 'create', 'expense', 6, 'added "Team Lunch" in Office Lunch');

        // Add some notifications
        const insertNotification = db.prepare(`
      INSERT INTO notifications (user_id, message, type, related_id)
      VALUES (?, ?, ?, ?)
    `);

        insertNotification.run(2, 'Sidharth added "Weekly Groceries" - you owe £40.00', 'expense_added', 1);
        insertNotification.run(3, 'Sidharth added "Weekly Groceries" - you owe £40.00', 'expense_added', 1);
        insertNotification.run(1, 'Shahaba added "Internet Bill December" - you owe £20.00', 'expense_added', 2);

        console.log('Database seeded successfully!');
    });
}

// Run if executed directly
if (process.argv[1]?.includes('seed')) {
    seedDatabase();
}
