import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image,
  Cpu,
  HardDrive,
  TrendingUp,
  Users,
  Info,
  Receipt
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

export default function CostDashboard() {
  const { customer, userProfile, isOwner, isSuperAdmin } = useCustomer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usageCosts, setUsageCosts] = useState([]);
  const [userCostsList, setUserCostsList] = useState([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [stats, setStats] = useState({
    totalImages: 0,
    totalLLMCalls: 0,
    totalCost: 0,
  });

  const loadData = async () => {
    if (!customer?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Load all costs and users for this customer
      const [allCosts, allUsers] = await Promise.all([
        base44.entities.UsageCost.list({ skipCustomerFilter: true }),
        base44.entities.UserProfile.list({ skipCustomerFilter: true })
      ]);

      // Current month boundaries
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Filter costs for this customer
      const customerCosts = allCosts.filter(c => c.customer_id === customer.id);

      // Filter costs for this month
      const monthCosts = customerCosts.filter(
        c => new Date(c.createdAt) >= monthStart
      );

      // Filter users for this customer
      const customerUsers = allUsers.filter(u => u.customer_id === customer.id);

      // Get surcharge percentage
      const surchargePercent = customer.surcharge_percent || 0;
      const surchargeMultiplier = 1 + surchargePercent / 100;

      // Calculate costs per user (with surcharge) - this month only
      const userCostsMap = {};
      monthCosts.forEach(cost => {
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
        isCurrentUser: user.id === userProfile?.id
      })).sort((a, b) => b.cost - a.cost); // Sort by cost descending

      setUserCostsList(usersList);

      // Calculate monthly total (with surcharge)
      const totalMonthly = monthCosts.reduce(
        (sum, c) => sum + (c.cost_sek || 0) * surchargeMultiplier,
        0
      );
      setMonthlyTotal(totalMonthly);

      setUsageCosts(customerCosts);

      // Calculate all-time stats
      const totalImages = customerCosts.filter(c => c.action === 'image_generation').length;
      const totalLLMCalls = customerCosts.filter(c => c.action === 'llm_invocation').length;
      const totalCost = customerCosts.reduce((sum, c) => sum + (c.cost_usd || 0), 0);

      setStats({ totalImages, totalLLMCalls, totalCost });
    } catch (err) {
      console.error('Failed to load usage data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [customer?.id]);

  const hasAccess = isOwner() || isSuperAdmin();

  if (!hasAccess) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Åtkomst nekad. Endast ägare kan se kostnadspanelen.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Get current month name in Swedish
  const monthName = new Date().toLocaleDateString('sv-SE', { month: 'long' });

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('admin')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              Kostnadspanel
            </h1>
            <p className="text-muted-foreground">
              Användningsstatistik för {customer?.name || 'din organisation'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* This Month's Total */}
          <Card className="border-[#392599]/20 bg-[#392599]/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#392599]/10">
                  <Receipt className="h-5 w-5 text-[#392599]" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground capitalize">
                    Förbrukning {monthName}
                  </div>
                  <div className="text-3xl font-bold text-[#392599]">
                    {monthlyTotal.toFixed(2)} kr
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Per-User Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Kostnad per användare
              </CardTitle>
              <CardDescription>Förbrukning denna månad per användare</CardDescription>
            </CardHeader>
            <CardContent>
              {userCostsList.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Ingen användning denna månad
                </div>
              ) : (
                <div className="divide-y">
                  {userCostsList.map(user => (
                    <div
                      key={user.id}
                      className={`py-3 flex justify-between items-center ${
                        user.isCurrentUser ? 'bg-[#392599]/5 -mx-6 px-6 rounded-lg' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className={`font-medium truncate ${user.isCurrentUser ? 'text-[#392599]' : ''}`}>
                          {user.name}
                          {user.isCurrentUser && (
                            <span className="ml-1 text-xs opacity-60">(du)</span>
                          )}
                        </div>
                        {user.name !== user.email && (
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-medium ml-3">
                        {user.cost.toFixed(2)} kr
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Image className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalImages}</div>
                    <div className="text-sm text-muted-foreground">Bilder genererade</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Cpu className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalLLMCalls}</div>
                    <div className="text-sm text-muted-foreground">AI-analyser</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      ${stats.totalCost.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total kostnad (USD)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Box */}
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm mb-1">Om kostnader</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Totalkostnaden för organisationen inkluderar bildgenerering, AI-analys,
                    fillagring (S3) och databasanvändning. Kostnader per användare visar
                    endast bildgenerering och AI-analys, därför stämmer inte summan exakt.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* No Usage Note */}
          {usageCosts.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Ingen användningsdata registrerad ännu</p>
                <p className="text-sm">
                  Kostnadsspårning visas här när du använder AI-funktioner
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
