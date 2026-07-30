import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  getDoc,
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, firebaseConfig } from '../config/firebase';
import { useAuth } from './AuthContext';
import { initializeApp, deleteApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentUser } = useAuth();
  
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loanPayments, setLoanPayments] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  
  // Monthly Closings & Selected Reporting Month
  const [monthlyClosings, setMonthlyClosings] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('CURRENT'); // 'CURRENT' or 'YYYY-MM'

  // Historical snapshot for closed month rendering
  const [historicalSnapshot, setHistoricalSnapshot] = useState(null);
  const [historicalSnapshotLoading, setHistoricalSnapshotLoading] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  // local storage database backup state
  const [isLocalFallback, setIsLocalFallback] = useState(false);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type, id: Date.now() });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Activity Logger (Audit Log) - theme-responsive
  const logActivity = async (actionType, description) => {
    if (!currentUser) return;
    
    const newLog = {
      timestamp: new Date().toISOString(),
      userId: currentUser.uid,
      username: currentUser.displayName || currentUser.email || 'User',
      userRole: currentUser.role || 'manager',
      actionType,
      description
    };

    if (isLocalFallback) {
      const logItem = { id: 'l-' + Date.now(), ...newLog };
      const newList = [logItem, ...activityLogs];
      setActivityLogs(newList);
      localStorage.setItem('xisaabiye_local_activity', JSON.stringify(newList));
      return;
    }

    try {
      await addDoc(collection(db, 'activity_logs'), {
        ...newLog,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.warn("Failed to write activity log to Firestore, saving locally:", e);
      const logItem = { id: 'l-' + Date.now(), ...newLog };
      const newList = [logItem, ...activityLogs];
      setActivityLogs(newList);
      localStorage.setItem('xisaabiye_local_activity', JSON.stringify(newList));
    }
  };

  // Initial local backup loader and default seed data
  useEffect(() => {
    if (isLocalFallback && currentUser) {
      console.info("Switching to Local Storage database fallback mode due to Firestore permission restrictions.");
      
      const localProducts = localStorage.getItem('xisaabiye_local_products');
      const localSales = localStorage.getItem('xisaabiye_local_sales');
      const localCustomers = localStorage.getItem('xisaabiye_local_customers');
      const localPayments = localStorage.getItem('xisaabiye_local_payments');
      const localLogs = localStorage.getItem('xisaabiye_local_activity');
      const localUsers = localStorage.getItem('xisaabiye_local_users');
      const localClosings = localStorage.getItem('xisaabiye_local_monthly_closings');

      if (localClosings) {
        setMonthlyClosings(JSON.parse(localClosings));
      }

      // Seeding Products
      if (localProducts) {
        setProducts(JSON.parse(localProducts));
      } else {
        const defaultProds = [];
        setProducts(defaultProds);
        localStorage.setItem('xisaabiye_local_products', JSON.stringify(defaultProds));
      }

      // Seeding Customers
      if (localCustomers) {
        setCustomers(JSON.parse(localCustomers));
      } else {
        const defaultCusts = [];
        setCustomers(defaultCusts);
        localStorage.setItem('xisaabiye_local_customers', JSON.stringify(defaultCusts));
      }

      // Seeding Sales
      if (localSales) {
        setSales(JSON.parse(localSales));
      } else {
        const defaultSales = [];
        setSales(defaultSales);
        localStorage.setItem('xisaabiye_local_sales', JSON.stringify(defaultSales));
      }

      // Seeding Payments
      if (localPayments) {
        setLoanPayments(JSON.parse(localPayments));
      } else {
        const defaultPayments = [];
        setLoanPayments(defaultPayments);
        localStorage.setItem('xisaabiye_local_payments', JSON.stringify(defaultPayments));
      }

      // Seeding Activity
      if (localLogs) {
        setActivityLogs(JSON.parse(localLogs));
      } else {
        const defaultLogs = [];
        setActivityLogs(defaultLogs);
        localStorage.setItem('xisaabiye_local_activity', JSON.stringify(defaultLogs));
      }

      // Seeding Users
      if (localUsers) {
        setUsersList(JSON.parse(localUsers));
      } else {
        const defaultUsers = [
          { id: 'u1', email: 'epraahmhudi@gmail.com', displayName: 'epraahmhudi', role: 'admin', createdAt: new Date().toISOString() }
        ];
        setUsersList(defaultUsers);
        localStorage.setItem('xisaabiye_local_users', JSON.stringify(defaultUsers));
      }
    }
  }, [isLocalFallback, currentUser]);

  // Real-time Firestore Listeners
  useEffect(() => {
    if (!currentUser || isLocalFallback) {
      setLoading(false);
      return;
    }

    // 1. Products Listener
    const prodQuery = query(collection(db, 'products'), orderBy('updatedAt', 'desc'));
    const unsubProducts = onSnapshot(prodQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
    }, (error) => {
      console.warn("Firestore products listener notice. Defaulting to local fallback database:", error);
      setIsLocalFallback(true);
    });

    // 2. Sales Listener
    const salesQuery = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSales(list);
    }, (error) => {
      console.warn("Firestore sales listener notice. Defaulting to local fallback database:", error);
      setIsLocalFallback(true);
    });

    // 3. Customers Listener
    const custQuery = query(collection(db, 'customers'), orderBy('totalDebt', 'desc'));
    const unsubCustomers = onSnapshot(custQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCustomers(list);
    }, (error) => {
      console.warn("Firestore customers listener notice. Defaulting to local fallback database:", error);
      setIsLocalFallback(true);
    });

    // 4. Loan Payments Listener
    const payQuery = query(collection(db, 'loanPayments'), orderBy('paymentDate', 'desc'));
    const unsubPayments = onSnapshot(payQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setLoanPayments(list);
    }, (error) => {
      console.warn("Firestore payments listener notice. Defaulting to local fallback database:", error);
      setIsLocalFallback(true);
    });

    // 5. Activity Logs Listener (Admin Audit)
    const logsQuery = query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setActivityLogs(list);
    }, (error) => {
      console.warn("Firestore activity_logs listener notice. Defaulting to local fallback database:", error);
      setIsLocalFallback(true);
    });

    // 6. Users List Listener
    const usersQuery = collection(db, 'users');
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort on client side to support documents missing a createdAt field or with different types
      list.sort((a, b) => {
        const getMs = (val) => {
          if (!val) return 0;
          if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
          if (val.seconds) return val.seconds * 1000;
          const parsed = Date.parse(val);
          return isNaN(parsed) ? 0 : parsed;
        };
        return getMs(b.createdAt) - getMs(a.createdAt);
      });
      
      setUsersList(list);
    }, (error) => {
      console.warn("Firestore users listener notice. Defaulting to local fallback database:", error);
      setIsLocalFallback(true);
    });

    // 7. Monthly Closings Listener
    const closingsQuery = query(collection(db, 'monthly_closings'), orderBy('monthYear', 'desc'));
    const unsubClosings = onSnapshot(closingsQuery, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setMonthlyClosings(list);
    }, (error) => {
      console.warn("Firestore monthly_closings listener notice. Defaulting to local fallback database:", error);
      const localClosings = localStorage.getItem('xisaabiye_local_monthly_closings');
      if (localClosings) setMonthlyClosings(JSON.parse(localClosings));
    });

    setLoading(false);

    return () => {
      unsubProducts();
      unsubSales();
      unsubCustomers();
      unsubPayments();
      unsubLogs();
      unsubUsers();
      unsubClosings();
    };
  }, [currentUser, isLocalFallback]);

  // Fetch historical snapshot when a closed month is selected
  useEffect(() => {
    if (!selectedMonth || selectedMonth === 'CURRENT') {
      setHistoricalSnapshot(null);
      return;
    }

    const closingInState = monthlyClosings.find(
      c => c.monthYear === selectedMonth && c.status === 'CLOSED'
    );
    if (!closingInState) {
      setHistoricalSnapshot(null);
      return;
    }

    // Try to fetch the full doc from Firestore for the richest data;
    // fall back gracefully to the already-cached state entry.
    const fetchSnapshot = async () => {
      setHistoricalSnapshotLoading(true);
      try {
        if (!isLocalFallback) {
          const snap = await getDoc(doc(db, 'monthly_closings', selectedMonth));
          if (snap.exists()) {
            setHistoricalSnapshot({ id: snap.id, ...snap.data() });
          } else {
            setHistoricalSnapshot(closingInState);
          }
        } else {
          // Local fallback — use the in-memory cached entry
          setHistoricalSnapshot(closingInState);
        }
      } catch (e) {
        console.warn('Failed to fetch historical snapshot from Firestore, using cached state:', e);
        setHistoricalSnapshot(closingInState);
      } finally {
        setHistoricalSnapshotLoading(false);
      }
    };

    fetchSnapshot();
  }, [selectedMonth, monthlyClosings, isLocalFallback]);

  // PRODUCT ACTIONS
  const addProduct = async (productData) => {
    const newProduct = {
      name: productData.name.trim(),
      category: productData.category.trim() || 'General',
      costPrice: parseFloat(productData.costPrice) || 0,
      unitSellingPrice: parseFloat(productData.unitSellingPrice) || 0,
      stockQuantity: parseInt(productData.stockQuantity, 10) || 0,
      updatedAt: new Date().toISOString()
    };

    if (isLocalFallback) {
      const newProductItem = {
        id: 'p-' + Date.now(),
        ...newProduct
      };
      const newList = [newProductItem, ...products];
      setProducts(newList);
      localStorage.setItem('xisaabiye_local_products', JSON.stringify(newList));
      
      await logActivity('ADD_STOCK', `${currentUser?.role?.toUpperCase()} ${currentUser?.displayName} added new product "${newProduct.name}" (${newProduct.stockQuantity} units @ $${newProduct.unitSellingPrice})`);
      showNotification(`Product "${newProduct.name}" created successfully (Local)!`);
      return newProductItem.id;
    }

    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...newProduct,
        updatedAt: serverTimestamp()
      });
      await logActivity('ADD_STOCK', `${currentUser?.role?.toUpperCase()} ${currentUser?.displayName} added new product "${newProduct.name}" (${newProduct.stockQuantity} units @ $${newProduct.unitSellingPrice})`);
      showNotification(`Product "${newProduct.name}" created successfully!`);
      return docRef.id;
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const newProductItem = {
          id: 'p-' + Date.now(),
          ...newProduct
        };
        const newList = [newProductItem, ...products];
        setProducts(newList);
        localStorage.setItem('xisaabiye_local_products', JSON.stringify(newList));
        
        await logActivity('ADD_STOCK', `${currentUser?.role?.toUpperCase()} ${currentUser?.displayName} added new product "${newProduct.name}" (${newProduct.stockQuantity} units @ $${newProduct.unitSellingPrice})`);
        showNotification(`Product "${newProduct.name}" created successfully (Local fallback)!`);
        return newProductItem.id;
      }
      throw error;
    }
  };

  const updateProduct = async (id, updatedFields) => {
    const updatedData = {
      ...updatedFields,
      costPrice: parseFloat(updatedFields.costPrice) || 0,
      unitSellingPrice: parseFloat(updatedFields.unitSellingPrice) || 0,
      stockQuantity: parseInt(updatedFields.stockQuantity, 10) || 0,
      updatedAt: new Date().toISOString()
    };

    if (isLocalFallback) {
      const newList = products.map(p => p.id === id ? { ...p, ...updatedData } : p);
      setProducts(newList);
      localStorage.setItem('xisaabiye_local_products', JSON.stringify(newList));
      await logActivity('UPDATE_STOCK', `${currentUser?.displayName} updated inventory item "${updatedFields.name}" (Stock: ${updatedData.stockQuantity})`);
      showNotification(`Product updated successfully (Local)!`);
      return;
    }

    try {
      const prodRef = doc(db, 'products', id);
      await updateDoc(prodRef, {
        ...updatedData,
        updatedAt: serverTimestamp()
      });
      await logActivity('UPDATE_STOCK', `${currentUser?.displayName} updated inventory item "${updatedFields.name}" (Stock: ${updatedData.stockQuantity})`);
      showNotification(`Product updated successfully!`);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const newList = products.map(p => p.id === id ? { ...p, ...updatedData } : p);
        setProducts(newList);
        localStorage.setItem('xisaabiye_local_products', JSON.stringify(newList));
        await logActivity('UPDATE_STOCK', `${currentUser?.displayName} updated inventory item "${updatedFields.name}" (Stock: ${updatedData.stockQuantity})`);
        showNotification(`Product updated successfully (Local fallback)!`);
        return;
      }
      throw error;
    }
  };

  const deleteProduct = async (id, name) => {
    if (currentUser?.role !== 'admin') {
      throw new Error("Only Administrators are permitted to delete product records.");
    }

    if (isLocalFallback) {
      const newList = products.filter(p => p.id !== id);
      setProducts(newList);
      localStorage.setItem('xisaabiye_local_products', JSON.stringify(newList));
      await logActivity('DELETE_PRODUCT', `ADMIN ${currentUser?.displayName} deleted product "${name}"`);
      showNotification(`Product "${name}" deleted (Local)`, 'warning');
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', id));
      await logActivity('DELETE_PRODUCT', `ADMIN ${currentUser?.displayName} deleted product "${name}"`);
      showNotification(`Product "${name}" deleted`, 'warning');
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const newList = products.filter(p => p.id !== id);
        setProducts(newList);
        localStorage.setItem('xisaabiye_local_products', JSON.stringify(newList));
        await logActivity('DELETE_PRODUCT', `ADMIN ${currentUser?.displayName} deleted product "${name}"`);
        showNotification(`Product "${name}" deleted (Local fallback)`, 'warning');
        return;
      }
      throw error;
    }
  };

  // SALE ACTIONS (POS)
  const addSale = async (saleData) => {
    const product = products.find(p => p.id === saleData.productId);
    if (!product) {
      throw new Error("Product not found");
    }

    const qtySold = parseInt(saleData.quantitySold, 10);
    if (qtySold > product.stockQuantity) {
      throw new Error(`Insufficient stock! Available: ${product.stockQuantity}, requested: ${qtySold}`);
    }

    const costPriceAtSale = parseFloat(product.costPrice) || 0;
    const unitSellingPrice = parseFloat(saleData.unitSellingPrice);
    const totalPrice = qtySold * unitSellingPrice;
    const profit = (unitSellingPrice - costPriceAtSale) * qtySold;

    const baseSale = {
      productId: product.id,
      productName: product.name,
      quantitySold: qtySold,
      costPriceAtSale,
      unitSellingPrice,
      totalPrice,
      profit,
      paymentStatus: saleData.paymentStatus, // 'cash' or 'loan'
      customerName: saleData.paymentStatus === 'loan' ? saleData.customerName.trim() : '',
      notes: saleData.notes ? saleData.notes.trim() : '',
      createdBy: currentUser?.displayName || currentUser?.email || 'User',
      createdByUid: currentUser?.uid
    };

    if (isLocalFallback) {
      const saleId = 's-' + Date.now();
      const localSaleRecord = {
        id: saleId,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        ...baseSale
      };

      // 1. Add Sale
      const newSalesList = [localSaleRecord, ...sales];
      setSales(newSalesList);
      localStorage.setItem('xisaabiye_local_sales', JSON.stringify(newSalesList));

      // 2. Decrement Stock
      const newStock = Math.max(0, product.stockQuantity - qtySold);
      const newProdsList = products.map(p => p.id === product.id ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p);
      setProducts(newProdsList);
      localStorage.setItem('xisaabiye_local_products', JSON.stringify(newProdsList));

      // 3. Update Customer Debt if Loan
      if (saleData.paymentStatus === 'loan') {
        const custName = saleData.customerName.trim();
        const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        let updatedCusts;

        if (existingCust) {
          updatedCusts = customers.map(c => c.id === existingCust.id ? { ...c, totalDebt: (c.totalDebt || 0) + totalPrice, lastTransactionDate: new Date().toISOString() } : c);
        } else {
          const newCust = {
            id: 'c-' + Date.now(),
            name: custName,
            phone: saleData.customerPhone || '',
            totalDebt: totalPrice,
            lastTransactionDate: new Date().toISOString()
          };
          updatedCusts = [newCust, ...customers];
        }
        setCustomers(updatedCusts);
        localStorage.setItem('xisaabiye_local_customers', JSON.stringify(updatedCusts));
        await logActivity('RECORD_LOAN', `${currentUser?.displayName} logged LOAN (Dayn) sale of ${product.name} (x${qtySold}) for ${custName} ($${totalPrice.toFixed(2)})`);
      } else {
        await logActivity('NEW_SALE', `${currentUser?.displayName} logged CASH sale of ${product.name} (x${qtySold}) for $${totalPrice.toFixed(2)}`);
      }

      showNotification(
        saleData.paymentStatus === 'loan' 
          ? `Loan Sale logged for ${localSaleRecord.customerName} ($${totalPrice.toFixed(2)})` 
          : `Cash Sale logged ($${totalPrice.toFixed(2)})`
      );
      return;
    }

    try {
      // Try Firestore
      await addDoc(collection(db, 'sales'), {
        date: serverTimestamp(),
        createdAt: serverTimestamp(),
        ...baseSale
      });

      const newStock = Math.max(0, product.stockQuantity - qtySold);
      await updateDoc(doc(db, 'products', product.id), {
        stockQuantity: newStock,
        updatedAt: serverTimestamp()
      });

      if (saleData.paymentStatus === 'loan') {
        const custName = saleData.customerName.trim();
        const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        
        if (existingCust) {
          await updateDoc(doc(db, 'customers', existingCust.id), {
            totalDebt: (existingCust.totalDebt || 0) + totalPrice,
            lastTransactionDate: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, 'customers'), {
            name: custName,
            phone: saleData.customerPhone || '',
            totalDebt: totalPrice,
            lastTransactionDate: serverTimestamp()
          });
        }
        await logActivity('RECORD_LOAN', `${currentUser?.displayName} logged LOAN (Dayn) sale of ${product.name} (x${qtySold}) for ${custName} ($${totalPrice.toFixed(2)})`);
      } else {
        await logActivity('NEW_SALE', `${currentUser?.displayName} logged CASH sale of ${product.name} (x${qtySold}) for $${totalPrice.toFixed(2)}`);
      }

      showNotification(
        saleData.paymentStatus === 'loan' 
          ? `Loan Sale logged for ${saleData.customerName.trim()} ($${totalPrice.toFixed(2)})` 
          : `Cash Sale logged ($${totalPrice.toFixed(2)})`
      );
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const saleId = 's-' + Date.now();
        const localSaleRecord = {
          id: saleId,
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          ...baseSale
        };

        const newSalesList = [localSaleRecord, ...sales];
        setSales(newSalesList);
        localStorage.setItem('xisaabiye_local_sales', JSON.stringify(newSalesList));

        const newStock = Math.max(0, product.stockQuantity - qtySold);
        const newProdsList = products.map(p => p.id === product.id ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p);
        setProducts(newProdsList);
        localStorage.setItem('xisaabiye_local_products', JSON.stringify(newProdsList));

        if (saleData.paymentStatus === 'loan') {
          const custName = saleData.customerName.trim();
          const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
          let updatedCusts;

          if (existingCust) {
            updatedCusts = customers.map(c => c.id === existingCust.id ? { ...c, totalDebt: (c.totalDebt || 0) + totalPrice, lastTransactionDate: new Date().toISOString() } : c);
          } else {
            const newCust = {
              id: 'c-' + Date.now(),
              name: custName,
              phone: saleData.customerPhone || '',
              totalDebt: totalPrice,
              lastTransactionDate: new Date().toISOString()
            };
            updatedCusts = [newCust, ...customers];
          }
          setCustomers(updatedCusts);
          localStorage.setItem('xisaabiye_local_customers', JSON.stringify(updatedCusts));
          await logActivity('RECORD_LOAN', `${currentUser?.displayName} logged LOAN (Dayn) sale of ${product.name} (x${qtySold}) for ${custName} ($${totalPrice.toFixed(2)})`);
        } else {
          await logActivity('NEW_SALE', `${currentUser?.displayName} logged CASH sale of ${product.name} (x${qtySold}) for $${totalPrice.toFixed(2)}`);
        }

        showNotification(
          saleData.paymentStatus === 'loan' 
            ? `Loan Sale logged for ${localSaleRecord.customerName} ($${totalPrice.toFixed(2)})` 
            : `Cash Sale logged ($${totalPrice.toFixed(2)})`
        );
        return;
      }
      throw error;
    }
  };

  const updateSale = async (id, updatedFields) => {
    const oldSale = sales.find(s => s.id === id);
    if (!oldSale) throw new Error("Sale record not found");

    const product = products.find(p => p.id === oldSale.productId);
    if (!product) throw new Error("Product not found");

    const oldQty = oldSale.quantitySold;
    const newQty = parseInt(updatedFields.quantitySold, 10);
    const costPriceAtSale = oldSale.costPriceAtSale || product.costPrice || 0;
    const newPrice = parseFloat(updatedFields.unitSellingPrice);
    
    // Check stock limit
    const qtyDiff = newQty - oldQty;
    const availablePool = product.stockQuantity + oldQty;
    if (newQty > availablePool) {
      throw new Error(`Insufficient stock! Available: ${availablePool}, requested: ${newQty}`);
    }

    const newTotalPrice = newQty * newPrice;
    const newProfit = (newPrice - costPriceAtSale) * newQty;
    const oldTotalPrice = oldSale.totalPrice || 0;

    const baseUpdatedSale = {
      quantitySold: newQty,
      unitSellingPrice: newPrice,
      totalPrice: newTotalPrice,
      profit: newProfit,
      paymentStatus: updatedFields.paymentStatus,
      customerName: updatedFields.paymentStatus === 'loan' ? updatedFields.customerName.trim() : '',
      notes: updatedFields.notes ? updatedFields.notes.trim() : ''
    };

    if (isLocalFallback) {
      const updatedSaleRecord = {
        ...oldSale,
        ...baseUpdatedSale
      };

      // Update sales
      const newSalesList = sales.map(s => s.id === id ? updatedSaleRecord : s);
      setSales(newSalesList);
      localStorage.setItem('xisaabiye_local_sales', JSON.stringify(newSalesList));

      // Update product stock
      const newStock = Math.max(0, product.stockQuantity - qtyDiff);
      const newProdsList = products.map(p => p.id === product.id ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p);
      setProducts(newProdsList);
      localStorage.setItem('xisaabiye_local_products', JSON.stringify(newProdsList));

      // Update customer debts
      let updatedCusts = [...customers];
      
      if (oldSale.paymentStatus === 'loan' && oldSale.customerName) {
        const oldCust = updatedCusts.find(c => c.name.toLowerCase() === oldSale.customerName.toLowerCase());
        if (oldCust) {
          oldCust.totalDebt = Math.max(0, (oldCust.totalDebt || 0) - oldTotalPrice);
          oldCust.lastTransactionDate = new Date().toISOString();
        }
      }

      if (updatedFields.paymentStatus === 'loan') {
        const newCustName = updatedFields.customerName.trim();
        const existingCust = updatedCusts.find(c => c.name.toLowerCase() === newCustName.toLowerCase());
        if (existingCust) {
          existingCust.totalDebt = (existingCust.totalDebt || 0) + newTotalPrice;
          existingCust.lastTransactionDate = new Date().toISOString();
        } else {
          const newCust = {
            id: 'c-' + Date.now(),
            name: newCustName,
            phone: updatedFields.customerPhone || '',
            totalDebt: newTotalPrice,
            lastTransactionDate: new Date().toISOString()
          };
          updatedCusts.push(newCust);
        }
      }

      setCustomers(updatedCusts);
      localStorage.setItem('xisaabiye_local_customers', JSON.stringify(updatedCusts));

      await logActivity('UPDATE_SALE', `${currentUser?.displayName} updated sale ID ${id} of ${product.name} (Qty: ${oldQty} -> ${newQty}, Price: $${oldSale.unitSellingPrice} -> $${newPrice})`);
      showNotification(`Sale transaction updated successfully (Local)!`);
      return;
    }

    try {
      // 1. Update Sale in Firestore
      await updateDoc(doc(db, 'sales', id), baseUpdatedSale);

      // 2. Update Product Stock in Firestore
      const newStock = Math.max(0, product.stockQuantity - qtyDiff);
      await updateDoc(doc(db, 'products', product.id), {
        stockQuantity: newStock,
        updatedAt: serverTimestamp()
      });

      // 3. Update Customer Debts in Firestore
      if (oldSale.paymentStatus === 'loan' && oldSale.customerName) {
        const oldCust = customers.find(c => c.name.toLowerCase() === oldSale.customerName.toLowerCase());
        if (oldCust) {
          await updateDoc(doc(db, 'customers', oldCust.id), {
            totalDebt: Math.max(0, (oldCust.totalDebt || 0) - oldTotalPrice),
            lastTransactionDate: serverTimestamp()
          });
        }
      }

      if (updatedFields.paymentStatus === 'loan') {
        const newCustName = updatedFields.customerName.trim();
        const existingCust = customers.find(c => c.name.toLowerCase() === newCustName.toLowerCase());
        if (existingCust) {
          await updateDoc(doc(db, 'customers', existingCust.id), {
            totalDebt: (existingCust.totalDebt || 0) + newTotalPrice,
            lastTransactionDate: serverTimestamp()
          });
        } else {
          await addDoc(collection(db, 'customers'), {
            name: newCustName,
            phone: updatedFields.customerPhone || '',
            totalDebt: newTotalPrice,
            lastTransactionDate: serverTimestamp()
          });
        }
      }

      await logActivity('UPDATE_SALE', `${currentUser?.displayName} updated sale ID ${id} of ${product.name} (Qty: ${oldQty} -> ${newQty}, Price: $${oldSale.unitSellingPrice} -> $${newPrice})`);
      showNotification(`Sale transaction updated successfully!`);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        return updateSale(id, updatedFields);
      }
      throw error;
    }
  };

  const deleteSale = async (id) => {
    const sale = sales.find(s => s.id === id);
    if (!sale) throw new Error("Sale record not found");

    const product = products.find(p => p.id === sale.productId);
    const quantitySold = sale.quantitySold || 0;
    const totalPrice = sale.totalPrice || 0;

    if (isLocalFallback) {
      // 1. Delete Sale
      const newSalesList = sales.filter(s => s.id !== id);
      setSales(newSalesList);
      localStorage.setItem('xisaabiye_local_sales', JSON.stringify(newSalesList));

      // 2. Restock Inventory
      if (product) {
        const newStock = product.stockQuantity + quantitySold;
        const newProdsList = products.map(p => p.id === product.id ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p);
        setProducts(newProdsList);
        localStorage.setItem('xisaabiye_local_products', JSON.stringify(newProdsList));
      }

      // 3. Revert Customer Debt if Loan
      if (sale.paymentStatus === 'loan' && sale.customerName) {
        const custName = sale.customerName;
        const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        if (existingCust) {
          const updatedCusts = customers.map(c => c.id === existingCust.id ? { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - totalPrice), lastTransactionDate: new Date().toISOString() } : c);
          setCustomers(updatedCusts);
          localStorage.setItem('xisaabiye_local_customers', JSON.stringify(updatedCusts));
        }
      }

      await logActivity('DELETE_SALE', `${currentUser?.displayName} deleted sale of ${sale.productName} (Qty: ${quantitySold}, Total: $${totalPrice.toFixed(2)})`);
      showNotification(`Sale transaction deleted successfully (Local)!`, 'warning');
      return;
    }

    try {
      // 1. Delete Sale in Firestore
      await deleteDoc(doc(db, 'sales', id));

      // 2. Restock Inventory in Firestore
      if (product) {
        const newStock = product.stockQuantity + quantitySold;
        await updateDoc(doc(db, 'products', product.id), {
          stockQuantity: newStock,
          updatedAt: serverTimestamp()
        });
      }

      // 3. Revert Customer Debt in Firestore if Loan
      if (sale.paymentStatus === 'loan' && sale.customerName) {
        const custName = sale.customerName;
        const existingCust = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        if (existingCust) {
          await updateDoc(doc(db, 'customers', existingCust.id), {
            totalDebt: Math.max(0, (existingCust.totalDebt || 0) - totalPrice),
            lastTransactionDate: serverTimestamp()
          });
        }
      }

      await logActivity('DELETE_SALE', `${currentUser?.displayName} deleted sale of ${sale.productName} (Qty: ${quantitySold}, Total: $${totalPrice.toFixed(2)})`);
      showNotification(`Sale transaction deleted successfully!`, 'warning');
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        return deleteSale(id);
      }
      throw error;
    }
  };

  // LOAN REPAYMENT ACTIONS
  const addLoanPayment = async (customerId, customerName, amountPaid, notes = '') => {
    const paid = parseFloat(amountPaid) || 0;
    if (paid <= 0) throw new Error("Payment amount must be greater than zero");

    const basePayment = {
      customerId,
      customerName,
      amountPaid: paid,
      receivedBy: currentUser?.displayName || currentUser?.email,
      notes: notes.trim()
    };

    if (isLocalFallback) {
      const payId = 'pay-' + Date.now();
      const localPay = {
        id: payId,
        paymentDate: new Date().toISOString(),
        ...basePayment
      };
      
      const newPayList = [localPay, ...loanPayments];
      setLoanPayments(newPayList);
      localStorage.setItem('xisaabiye_local_payments', JSON.stringify(newPayList));

      const updatedCusts = customers.map(c => {
        if (c.id === customerId) {
          return { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - paid), lastTransactionDate: new Date().toISOString() };
        }
        return c;
      });
      setCustomers(updatedCusts);
      localStorage.setItem('xisaabiye_local_customers', JSON.stringify(updatedCusts));

      await logActivity('LOAN_REPAYMENT', `${currentUser?.displayName} received Dayn repayment of $${paid.toFixed(2)} from ${customerName}`);
      showNotification(`Payment of $${paid.toFixed(2)} received from ${customerName} (Local)`);
      return;
    }

    try {
      await addDoc(collection(db, 'loanPayments'), {
        paymentDate: serverTimestamp(),
        ...basePayment
      });

      const cust = customers.find(c => c.id === customerId);
      if (cust) {
        const newDebt = Math.max(0, (cust.totalDebt || 0) - paid);
        await updateDoc(doc(db, 'customers', customerId), {
          totalDebt: newDebt,
          lastTransactionDate: serverTimestamp()
        });
      }

      await logActivity('LOAN_REPAYMENT', `${currentUser?.displayName} received Dayn repayment of $${paid.toFixed(2)} from ${customerName}`);
      showNotification(`Payment of $${paid.toFixed(2)} received from ${customerName}`);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const payId = 'pay-' + Date.now();
        const localPay = {
          id: payId,
          paymentDate: new Date().toISOString(),
          ...basePayment
        };
        
        const newPayList = [localPay, ...loanPayments];
        setLoanPayments(newPayList);
        localStorage.setItem('xisaabiye_local_payments', JSON.stringify(newPayList));

        const updatedCusts = customers.map(c => {
          if (c.id === customerId) {
            return { ...c, totalDebt: Math.max(0, (c.totalDebt || 0) - paid), lastTransactionDate: new Date().toISOString() };
          }
          return c;
        });
        setCustomers(updatedCusts);
        localStorage.setItem('xisaabiye_local_customers', JSON.stringify(updatedCusts));

        await logActivity('LOAN_REPAYMENT', `${currentUser?.displayName} received Dayn repayment of $${paid.toFixed(2)} from ${customerName}`);
        showNotification(`Payment of $${paid.toFixed(2)} received from ${customerName} (Local fallback)`);
        return;
      }
      throw error;
    }
  };

  // USER ACTIONS
  const updateUser = async (id, updatedFields) => {
    if (currentUser?.role !== 'admin') {
      throw new Error("Only Administrators can modify user accounts.");
    }

    if (isLocalFallback) {
      const newList = usersList.map(u => u.id === id ? { ...u, ...updatedFields } : u);
      setUsersList(newList);
      localStorage.setItem('xisaabiye_local_users', JSON.stringify(newList));
      await logActivity('UPDATE_USER', `${currentUser.displayName} updated user role/status for ID "${id}"`);
      showNotification(`User updated successfully (Local)!`);
      return;
    }

    try {
      const userRef = doc(db, 'users', id);
      await updateDoc(userRef, updatedFields);
      await logActivity('UPDATE_USER', `${currentUser.displayName} updated user role/status for ID "${id}"`);
      showNotification(`User updated successfully!`);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const newList = usersList.map(u => u.id === id ? { ...u, ...updatedFields } : u);
        setUsersList(newList);
        localStorage.setItem('xisaabiye_local_users', JSON.stringify(newList));
        await logActivity('UPDATE_USER', `${currentUser.displayName} updated user role/status for ID "${id}"`);
        showNotification(`User updated successfully (Local fallback)!`);
        return;
      }
      throw error;
    }
  };

  const deleteUser = async (id, email) => {
    if (currentUser?.role !== 'admin') {
      throw new Error("Only Administrators can delete user accounts.");
    }

    if (isLocalFallback) {
      const newList = usersList.filter(u => u.id !== id);
      setUsersList(newList);
      localStorage.setItem('xisaabiye_local_users', JSON.stringify(newList));
      await logActivity('DELETE_USER', `ADMIN ${currentUser.displayName} deleted user account "${email}"`);
      showNotification(`User account "${email}" deleted (Local)`, 'warning');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', id));
      await logActivity('DELETE_USER', `ADMIN ${currentUser.displayName} deleted user account "${email}"`);
      showNotification(`User account "${email}" deleted successfully!`, 'warning');
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const newList = usersList.filter(u => u.id !== id);
        setUsersList(newList);
        localStorage.setItem('xisaabiye_local_users', JSON.stringify(newList));
        await logActivity('DELETE_USER', `ADMIN ${currentUser.displayName} deleted user account "${email}"`);
        showNotification(`User account "${email}" deleted (Local fallback)`, 'warning');
        return;
      }
      throw error;
    }
  };

  const createUserAccount = async (displayName, email, password, role, status) => {
    if (currentUser?.role !== 'admin') {
      throw new Error("Only Administrators can create new user accounts.");
    }

    const userData = {
      displayName: displayName.trim(),
      email: email.trim(),
      role: role,
      status: status,
      createdAt: new Date().toISOString()
    };

    if (isLocalFallback) {
      const localId = 'usr-' + Date.now();
      const newUser = { id: localId, uid: localId, ...userData };
      const newList = [newUser, ...usersList];
      setUsersList(newList);
      localStorage.setItem('xisaabiye_local_users', JSON.stringify(newList));
      await logActivity('NEW_USER_CREATED', `Admin created new ${role.toUpperCase()} user "${displayName}" (${email})`);
      showNotification(`New ${role} user "${displayName}" created successfully (Local)!`);
      return newUser;
    }

    // Secondary Firebase App setup to prevent admin logouts
    const secondaryAppName = "SecondaryAuthInstance";
    
    // Reuse or initialize secondary app safely
    let secondaryApp = getApps().find(app => app.name === secondaryAppName);
    if (!secondaryApp) {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }

    const secondaryAuth = getAuth(secondaryApp);

    try {
      const userCred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
      const newUid = userCred.user.uid;
      
      const firestoreUser = {
        uid: newUid,
        displayName: displayName.trim(),
        email: email.trim(),
        role: role,
        status: status,
        createdAt: new Date().toISOString()
      };

      // Create document in users collection using UID as document ID
      const userDocRef = doc(db, 'users', newUid);
      await setDoc(userDocRef, firestoreUser);

      await logActivity('NEW_USER_CREATED', `Admin created new ${role.toUpperCase()} user "${displayName}" (${email})`);
      showNotification(`New ${role} user "${displayName}" created successfully!`);
      
      return { id: newUid, ...firestoreUser };
    } catch (error) {
      console.error("Firebase auth secondary register error:", error);
      throw error;
    } finally {
      if (secondaryApp) {
        try {
          await deleteApp(secondaryApp);
        } catch (cleanupErr) {
          console.warn("Secondary app cleanup warning:", cleanupErr);
        }
      }
    }
  };

  // MONTHLY CLOSEOUT (XISAAB XIR) ACTIONS
  const closeMonth = async (monthYear, summaryData) => {
    const docId = monthYear;
    const closingDoc = {
      id: docId,
      monthYear,
      closedAt: new Date().toISOString(),
      closedBy: currentUser?.displayName || currentUser?.email || 'Admin',
      // Core financials
      totalSales: summaryData.totalSales || 0,
      grossProfit: summaryData.grossProfit || 0,
      totalExpenses: summaryData.totalExpenses || 0,
      netProfit: summaryData.netProfit || 0,
      carryoverCustomerDebt: summaryData.carryoverCustomerDebt || 0,
      carryoverSupplierDebt: summaryData.carryoverSupplierDebt || 0,
      // Enriched fields for historical Dashboard rendering
      totalSalesCount: summaryData.totalSalesCount || 0,
      totalCashReceived: summaryData.totalCashReceived || 0,
      totalLoanSales: summaryData.totalLoanSales || 0,
      inventoryValue: summaryData.inventoryValue || 0,
      totalInventoryUnits: summaryData.totalInventoryUnits || 0,
      debtorCount: summaryData.debtorCount || 0,
      status: "CLOSED"
    };

    if (isLocalFallback) {
      const newClosings = [closingDoc, ...monthlyClosings.filter(c => c.monthYear !== monthYear)];
      setMonthlyClosings(newClosings);
      localStorage.setItem('xisaabiye_local_monthly_closings', JSON.stringify(newClosings));
      await logActivity('XISAAB_XIR', `Admin executed Xisaab Xir (Closeout) for period ${monthYear}. Net Profit: $${(summaryData.netProfit || 0).toFixed(2)}`);
      showNotification(`Period ${monthYear} closed successfully (Local)!`);
      return;
    }

    try {
      await setDoc(doc(db, 'monthly_closings', docId), {
        ...closingDoc,
        closedAt: serverTimestamp()
      });
      await logActivity('XISAAB_XIR', `Admin executed Xisaab Xir (Closeout) for period ${monthYear}. Net Profit: $${(summaryData.netProfit || 0).toFixed(2)}`);
      showNotification(`Period ${monthYear} closed successfully!`);
    } catch (error) {
      if (error.code === 'permission-denied' || error.message?.includes('permission')) {
        setIsLocalFallback(true);
        const newClosings = [closingDoc, ...monthlyClosings.filter(c => c.monthYear !== monthYear)];
        setMonthlyClosings(newClosings);
        localStorage.setItem('xisaabiye_local_monthly_closings', JSON.stringify(newClosings));
        await logActivity('XISAAB_XIR', `Admin executed Xisaab Xir (Closeout) for period ${monthYear}. Net Profit: $${(summaryData.netProfit || 0).toFixed(2)}`);
        showNotification(`Period ${monthYear} closed successfully (Local fallback)!`);
        return;
      }
      throw error;
    }
  };

  const isClosedMonth = selectedMonth !== 'CURRENT' && monthlyClosings.some(c => c.monthYear === selectedMonth && c.status === 'CLOSED');

  // Set of all YYYY-MM periods that have been closed — used to exclude closed-period
  // transactions from the "Current Active Month" live metrics in the Dashboard.
  const closedMonthPeriods = new Set(
    monthlyClosings.filter(c => c.status === 'CLOSED').map(c => c.monthYear)
  );

  const value = {
    products,
    sales,
    customers,
    loanPayments,
    activityLogs,
    usersList,
    loading,
    notification,
    monthlyClosings,
    selectedMonth,
    setSelectedMonth,
    closeMonth,
    isClosedMonth,
    closedMonthPeriods,
    historicalSnapshot,
    historicalSnapshotLoading,
    addProduct,
    updateProduct,
    deleteProduct,
    addSale,
    updateSale,
    deleteSale,
    addLoanPayment,
    updateUser,
    deleteUser,
    createUserAccount,
    logActivity,
    showNotification
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
