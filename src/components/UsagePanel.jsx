import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Receipt, Info, Building2, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCustomer } from '@/lib/CustomerContext';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/amplifyClient';

export default function UsagePanel({ darkMode }) {
  const { isAuthenticated } = useAuth();
  const { customer, userProfile } = useCustomer();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customerTotal, setCustomerTotal] = useState(0);
  const [userCostsList, setUserCostsList] = useState([]);

  // Load usage costs when panel opens
  useEffect(() => {
    if (isOpen && userProfile?.id && customer?.id) {
      loadCosts();
    }
  }, [isOpen, userProfile?.id, customer?.id]);

  const loadCosts = async () => {
    if (!userProfile?.id || !customer?.id) return;

    setLoading(true);
    try {
      // Load all costs and users for this customer
      const [allCosts, allUsers] = await Promise.all([
        base44.entities.UsageCost.list({ skipCustomerFilter: true }),
        base44.entities.UserProfile.list({ skipCustomerFilter: true })
      ]);

      // Current month boundaries
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Filter costs for this customer and this month
      const customerCostRecords = allCosts.filter(
        c => c.customer_id === customer.id && new Date(c.createdAt) >= monthStart
      );

      // Filter users for this customer
      const customerUsers = allUsers.filter(u => u.customer_id === customer.id);

      // Get surcharge percentage
      const surchargePercent = customer.surcharge_percent || 0;
      const surchargeMultiplier = 1 + surchargePercent / 100;

      // Calculate costs per user (with surcharge)
      const userCostsMap = {};
      customerCostRecords.forEach(cost => {
        const userId = cost.user_profile_id;
        if (!userCostsMap[userId]) {
          userCostsMap[userId] = 0;
        }
        userCostsMap[userId] += (cost.cost_sek || 0) * surchargeMultiplier;
      });

      // Build user costs list with names
      const usersList = customerUsers.map(user => ({
        id: user.id,
        name: user.display_name || user.email || 'Okänd',
        email: user.email,
        cost: userCostsMap[user.id] || 0,
        isCurrentUser: user.id === userProfile.id
      })).sort((a, b) => b.cost - a.cost); // Sort by cost descending

      setUserCostsList(usersList);

      // Calculate total customer cost (with surcharge)
      const totalCost = customerCostRecords.reduce(
        (sum, c) => sum + (c.cost_sek || 0) * surchargeMultiplier,
        0
      );
      setCustomerTotal(totalCost);

    } catch (err) {
      console.error('Failed to load usage costs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Don't render if not authenticated
  if (!isAuthenticated || !userProfile) {
    return null;
  }

  return (
    <>
      {/* Tab on right edge - HeyLook brand color #392599 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 py-4 px-2 rounded-l-lg shadow-lg transition-all duration-200 hover:pr-3 flex items-center justify-center text-white"
        style={{
          writingMode: 'vertical-rl',
          textOrientation: 'mixed',
          backgroundColor: '#392599'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4a2fb3'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#392599'}
      >
        <Receipt className="h-4 w-4 mb-2 rotate-90" />
        <span className="text-sm font-medium">Förbrukning</span>
      </button>

      {/* Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed right-0 top-0 bottom-0 z-50 w-96",
                "shadow-2xl overflow-y-auto",
                darkMode
                  ? "bg-[#1a1a1a] text-white"
                  : "bg-white text-black"
              )}
            >
              {/* Header */}
              <div className={cn(
                "sticky top-0 p-4 border-b flex items-center justify-between",
                darkMode ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
              )}>
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" style={{ color: '#392599' }} />
                  <h2 className="font-semibold">Förbrukning</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "p-1.5 rounded-full transition-colors",
                    darkMode ? "hover:bg-white/10" : "hover:bg-black/5"
                  )}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#392599' }} />
                  </div>
                ) : (
                  <>
                    {/* Customer Aggregate */}
                    <div className={cn(
                      "rounded-xl p-4 border",
                      darkMode ? "bg-white/5 border-white/10" : "border-gray-200"
                    )}
                    style={{ backgroundColor: darkMode ? undefined : '#f8f6ff' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4" style={{ color: '#392599' }} />
                        <h3 className="font-medium text-sm">{customer?.name || 'Organisation'}</h3>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={cn("text-sm", darkMode ? "text-white/60" : "text-black/60")}>
                          Denna månad
                        </span>
                        <span className="font-bold text-xl" style={{ color: '#392599' }}>
                          {customerTotal.toFixed(2)} kr
                        </span>
                      </div>
                    </div>

                    {/* Users Table */}
                    <div className={cn(
                      "rounded-xl border overflow-hidden",
                      darkMode ? "border-white/10" : "border-gray-200"
                    )}>
                      <div className={cn(
                        "px-4 py-2 border-b flex items-center gap-2",
                        darkMode ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"
                      )}>
                        <Users className="h-4 w-4" style={{ color: '#392599' }} />
                        <h3 className="font-medium text-sm">Användare</h3>
                      </div>

                      <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {userCostsList.length === 0 ? (
                          <div className={cn(
                            "px-4 py-3 text-sm text-center",
                            darkMode ? "text-white/40" : "text-black/40"
                          )}>
                            Ingen användning denna månad
                          </div>
                        ) : (
                          userCostsList.map(user => (
                            <div
                              key={user.id}
                              className={cn(
                                "px-4 py-2 flex justify-between items-center",
                                user.isCurrentUser && (darkMode ? "bg-white/5" : "bg-purple-50")
                              )}
                            >
                              <div className="min-w-0 flex-1">
                                <div className={cn(
                                  "text-sm font-medium truncate",
                                  user.isCurrentUser && "text-[#392599]"
                                )}>
                                  {user.name}
                                  {user.isCurrentUser && (
                                    <span className="ml-1 text-xs opacity-60">(du)</span>
                                  )}
                                </div>
                                {user.name !== user.email && (
                                  <div className={cn(
                                    "text-xs truncate",
                                    darkMode ? "text-white/40" : "text-black/40"
                                  )}>
                                    {user.email}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-medium ml-3">
                                {user.cost.toFixed(2)} kr
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className={cn(
                      "rounded-xl p-4 border",
                      darkMode ? "bg-white/5 border-white/10" : "bg-blue-50 border-blue-100"
                    )}>
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="h-4 w-4 text-blue-500" />
                        <h3 className="font-medium text-sm">Om kostnader</h3>
                      </div>
                      <p className={cn("text-xs leading-relaxed", darkMode ? "text-white/60" : "text-black/60")}>
                        Totalkostnaden för organisationen inkluderar bildgenerering, AI-analys,
                        fillagring (S3) och databasanvändning. Kostnader per användare visar
                        endast bildgenerering och AI-analys, därför stämmer inte summan exakt.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
