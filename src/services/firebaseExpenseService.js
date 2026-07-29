import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  updateDoc,
  runTransaction,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

const SEED_SUPPLIERS = [];

const SEED_EXPENSES = [];

// Helper to determine if we should run in local fallback mode
const isLocalMode = () => {
  return localStorage.getItem('xisaabiye_use_local_fallback') === 'true';
};

// Sanitize and Initialize Local Storage
const initLocalStorage = () => {
  try {
    const existingSuppliers = localStorage.getItem('xisaabiye_local_suppliers');
    if (existingSuppliers) {
      const parsed = JSON.parse(existingSuppliers);
      if (Array.isArray(parsed) && parsed.some(s => (s.id && s.id.startsWith('sup-')) || s.name === 'Hormuud Telecom' || s.name === 'Somali Energy Corp')) {
        localStorage.removeItem('xisaabiye_local_suppliers');
      }
    }

    const existingExpenses = localStorage.getItem('xisaabiye_local_expenses');
    if (existingExpenses) {
      const parsed = JSON.parse(existingExpenses);
      if (Array.isArray(parsed) && parsed.some(e => (e.id && e.id.startsWith('exp-')) || e.receiptNo === 'REC-9081')) {
        localStorage.removeItem('xisaabiye_local_expenses');
      }
    }
  } catch (e) {
    console.warn("Error sanitizing local storage demo data:", e);
  }

  if (!localStorage.getItem('xisaabiye_local_suppliers')) {
    localStorage.setItem('xisaabiye_local_suppliers', JSON.stringify(SEED_SUPPLIERS));
  }
  if (!localStorage.getItem('xisaabiye_local_expenses')) {
    localStorage.setItem('xisaabiye_local_expenses', JSON.stringify(SEED_EXPENSES));
  }
};

// Auto initialize local storage arrays
initLocalStorage();

/**
 * Fetch all suppliers
 */
export const fetchSuppliers = async () => {
  if (isLocalMode()) {
    return JSON.parse(localStorage.getItem('xisaabiye_local_suppliers') || '[]');
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'suppliers'));
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn("Firestore suppliers query failed, falling back to local storage:", error);
    localStorage.setItem('xisaabiye_use_local_fallback', 'true');
    return JSON.parse(localStorage.getItem('xisaabiye_local_suppliers') || '[]');
  }
};

/**
 * Fetch all expenses
 */
export const fetchExpenses = async () => {
  if (isLocalMode()) {
    const list = JSON.parse(localStorage.getItem('xisaabiye_local_expenses') || '[]');
    // Sort local by date desc
    return list.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  try {
    const querySnapshot = await getDocs(collection(db, 'expenses'));
    return querySnapshot.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        date: data.date instanceof Timestamp ? data.date.toDate().toISOString() : data.date,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.warn("Firestore expenses query failed, falling back to local storage:", error);
    localStorage.setItem('xisaabiye_use_local_fallback', 'true');
    return JSON.parse(localStorage.getItem('xisaabiye_local_expenses') || '[]');
  }
};

/**
 * Add a new supplier document
 */
export const addSupplier = async (name, initialBalance = 0) => {
  const trimmedName = name.trim();
  if (isLocalMode()) {
    const suppliers = JSON.parse(localStorage.getItem('xisaabiye_local_suppliers') || '[]');
    // Check if supplier with same name exists
    const existing = suppliers.find(s => s.name.toLowerCase() === trimmedName.toLowerCase());
    if (existing) return existing;

    const newSup = {
      id: 'sup-' + Date.now(),
      name: trimmedName,
      currentBalance: initialBalance,
      phone: '',
      createdAt: new Date().toISOString()
    };
    suppliers.push(newSup);
    localStorage.setItem('xisaabiye_local_suppliers', JSON.stringify(suppliers));
    return newSup;
  }

  try {
    const docRef = await addDoc(collection(db, 'suppliers'), {
      name: trimmedName,
      currentBalance: initialBalance,
      phone: '',
      createdAt: serverTimestamp()
    });
    return {
      id: docRef.id,
      name: trimmedName,
      currentBalance: initialBalance
    };
  } catch (error) {
    console.warn("Firestore addSupplier failed, using local storage:", error);
    localStorage.setItem('xisaabiye_use_local_fallback', 'true');
    return addSupplier(trimmedName, initialBalance);
  }
};

/**
 * Add a new expense (with Firestore transaction if it is a supplier payment)
 */
export const addExpense = async (expenseData, currentUserId) => {
  const isSupplierPayment = expenseData.type === 'supplier_payment';

  // Handle dynamic creation of a new supplier if provided
  let targetSupplierId = expenseData.supplierId;
  let targetSupplierName = expenseData.supplierName;

  if (isSupplierPayment && (!targetSupplierId || expenseData.isNewSupplier) && targetSupplierName) {
    const createdSup = await addSupplier(targetSupplierName, 0);
    targetSupplierId = createdSup.id;
  }

  if (isLocalMode()) {
    const expenses = JSON.parse(localStorage.getItem('xisaabiye_local_expenses') || '[]');
    const suppliers = JSON.parse(localStorage.getItem('xisaabiye_local_suppliers') || '[]');

    const newExpense = {
      id: 'exp-' + Date.now(),
      ...expenseData,
      supplierId: targetSupplierId || '',
      supplierName: targetSupplierName || '',
      createdAt: new Date().toISOString(),
      createdBy: currentUserId || 'local-user'
    };

    expenses.push(newExpense);
    localStorage.setItem('xisaabiye_local_expenses', JSON.stringify(expenses));

    if (isSupplierPayment && targetSupplierId) {
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === targetSupplierId) {
          return { ...s, currentBalance: (s.currentBalance || 0) - expenseData.amount };
        }
        return s;
      });
      localStorage.setItem('xisaabiye_local_suppliers', JSON.stringify(updatedSuppliers));
    }

    return newExpense;
  }

  try {
    if (isSupplierPayment && targetSupplierId) {
      // Transaction to safely update both expense and supplier documents
      await runTransaction(db, async (transaction) => {
        const supplierRef = doc(db, 'suppliers', targetSupplierId);
        const supplierSnap = await transaction.get(supplierRef);
        
        let currentBal = 0;
        if (supplierSnap.exists()) {
          currentBal = supplierSnap.data().currentBalance || 0;
        }

        const newBal = currentBal - expenseData.amount;

        // 1. Update supplier balance
        if (supplierSnap.exists()) {
          transaction.update(supplierRef, { currentBalance: newBal });
        } else {
          transaction.set(supplierRef, {
            name: targetSupplierName || 'Supplier',
            currentBalance: newBal,
            createdAt: serverTimestamp()
          });
        }

        // 2. Add expense document
        const expenseColRef = collection(db, 'expenses');
        const expenseDocRef = doc(expenseColRef);
        transaction.set(expenseDocRef, {
          type: expenseData.type,
          category: expenseData.category,
          supplierId: targetSupplierId,
          supplierName: targetSupplierName,
          amount: expenseData.amount,
          paymentMethod: expenseData.paymentMethod,
          receiptNo: expenseData.receiptNo || '',
          notes: expenseData.notes || '',
          date: Timestamp.fromDate(new Date(expenseData.date)),
          createdAt: serverTimestamp(),
          createdBy: currentUserId || 'system'
        });
      });
    } else {
      // Direct operational expense
      await addDoc(collection(db, 'expenses'), {
        type: expenseData.type,
        category: expenseData.category,
        amount: expenseData.amount,
        paymentMethod: expenseData.paymentMethod,
        receiptNo: expenseData.receiptNo || '',
        notes: expenseData.notes || '',
        date: Timestamp.fromDate(new Date(expenseData.date)),
        createdAt: serverTimestamp(),
        createdBy: currentUserId || 'system'
      });
    }
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.warn("Firestore write failed (permission denied), falling back to local storage:", error);
      localStorage.setItem('xisaabiye_use_local_fallback', 'true');
      return addExpense(expenseData, currentUserId); // Retry locally
    }
    throw error;
  }
};

/**
 * Delete an expense (reverting supplier balance if it was a supplier payment)
 */
export const deleteExpense = async (expenseId) => {
  if (isLocalMode()) {
    const expenses = JSON.parse(localStorage.getItem('xisaabiye_local_expenses') || '[]');
    const suppliers = JSON.parse(localStorage.getItem('xisaabiye_local_suppliers') || '[]');

    const targetExpense = expenses.find(e => e.id === expenseId);
    if (!targetExpense) return;

    const filteredExpenses = expenses.filter(e => e.id !== expenseId);
    localStorage.setItem('xisaabiye_local_expenses', JSON.stringify(filteredExpenses));

    if (targetExpense.type === 'supplier_payment' && targetExpense.supplierId) {
      const updatedSuppliers = suppliers.map(s => {
        if (s.id === targetExpense.supplierId) {
          return { ...s, currentBalance: s.currentBalance + targetExpense.amount };
        }
        return s;
      });
      localStorage.setItem('xisaabiye_local_suppliers', JSON.stringify(updatedSuppliers));
    }
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      const expenseRef = doc(db, 'expenses', expenseId);
      const expenseSnap = await transaction.get(expenseRef);
      if (!expenseSnap.exists()) {
        throw new Error("Expense entry does not exist.");
      }

      const expense = expenseSnap.data();

      // If it was a supplier payment, revert the balance change
      if (expense.type === 'supplier_payment' && expense.supplierId) {
        const supplierRef = doc(db, 'suppliers', expense.supplierId);
        const supplierSnap = await transaction.get(supplierRef);
        if (supplierSnap.exists()) {
          const currentBal = supplierSnap.data().currentBalance || 0;
          transaction.update(supplierRef, { currentBalance: currentBal + expense.amount });
        }
      }

      // Delete the expense document
      transaction.delete(expenseRef);
    });
  } catch (error) {
    if (error.code === 'permission-denied' || error.message?.includes('permission')) {
      console.warn("Firestore delete failed (permission denied), falling back to local storage:", error);
      localStorage.setItem('xisaabiye_use_local_fallback', 'true');
      return deleteExpense(expenseId); // Retry locally
    }
    throw error;
  }
};
