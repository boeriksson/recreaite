import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image,
  Cpu,
  HardDrive,
  TrendingUp
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

export default function CostDashboard() {
  const { customer, isOwner, isSuperAdmin } = useCustomer();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usageCosts, setUsageCosts] = useState([]);
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
      // Load usage costs for this customer
      const costs = await base44.entities.UsageCost.filter({
        customer_id: customer.id,
      });

      setUsageCosts(costs);

      // Calculate stats
      const totalImages = costs.filter(c => c.action === 'image_generation').length;
      const totalLLMCalls = costs.filter(c => c.action === 'llm_invocation').length;
      const totalCost = costs.reduce((sum, c) => sum + (c.cost_usd || 0), 0);

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
            Access denied. Only owners can view the cost dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const usagePercent = customer?.images_limit_monthly === -1
    ? 0
    : ((customer?.images_generated_this_month || 0) / (customer?.images_limit_monthly || 100)) * 100;

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
              Cost Dashboard
            </h1>
            <p className="text-muted-foreground">
              Usage statistics for {customer?.name || 'your brand'}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Your subscription and usage limits</CardDescription>
            </div>
            <Badge className="text-lg px-3 py-1">
              {(customer?.plan || 'free').toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Images this month</span>
              <span className="font-medium">
                {customer?.images_generated_this_month || 0}
                {customer?.images_limit_monthly !== -1 && (
                  <span className="text-muted-foreground">
                    {' '}/ {customer?.images_limit_monthly || 100}
                  </span>
                )}
              </span>
            </div>
            {customer?.images_limit_monthly !== -1 && (
              <Progress value={usagePercent} className="h-2" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-sm">
              <span className="text-muted-foreground">Storage limit: </span>
              <span className="font-medium">{customer?.storage_limit_gb || 10} GB</span>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Resets: </span>
              <span className="font-medium">
                {customer?.usage_reset_date
                  ? new Date(customer.usage_reset_date).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Image className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.totalImages}</div>
                    <div className="text-sm text-muted-foreground">Images Generated</div>
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
                    <div className="text-sm text-muted-foreground">AI Analyses</div>
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
                    <div className="text-sm text-muted-foreground">Total Cost (USD)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Note */}
          {usageCosts.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <HardDrive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No usage data recorded yet</p>
                <p className="text-sm">
                  Cost tracking will appear here as you use AI features
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
