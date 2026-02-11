import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Image,
  MessageSquare,
  Cpu,
  HardDrive,
  Globe,
  Receipt
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44 } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

const ACTION_CONFIG = {
  image_generation: {
    label: 'Bildgenerering',
    icon: Image,
    color: 'bg-purple-100 text-purple-800',
  },
  llm_invocation: {
    label: 'AI-analys',
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-800',
  },
  custom_model_training: {
    label: 'Modellträning',
    icon: Cpu,
    color: 'bg-orange-100 text-orange-800',
  },
  storage_upload: {
    label: 'Lagring (S3)',
    icon: HardDrive,
    color: 'bg-green-100 text-green-800',
  },
  dynamodb_write: {
    label: 'Databas',
    icon: HardDrive,
    color: 'bg-teal-100 text-teal-800',
  },
  site_scan: {
    label: 'Webbskanning',
    icon: Globe,
    color: 'bg-cyan-100 text-cyan-800',
  },
};

export default function UsageHistory() {
  const { isSuperAdmin } = useCustomer();
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('user');
  const customerId = searchParams.get('customer');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [costs, setCosts] = useState([]);
  const [user, setUser] = useState(null);
  const [customer, setCustomer] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load user and customer info
      if (userId) {
        const userData = await base44.entities.UserProfile.get(userId);
        setUser(userData);
      }
      if (customerId) {
        const customerData = await base44.entities.Customer.get(customerId);
        setCustomer(customerData);
      }

      // Load usage costs for this user
      const allCosts = await base44.entities.UsageCost.list({ skipCustomerFilter: true });

      // Filter by user if specified, otherwise by customer
      let filteredCosts = allCosts;
      if (userId) {
        filteredCosts = allCosts.filter(c => c.user_profile_id === userId);
      } else if (customerId) {
        filteredCosts = allCosts.filter(c => c.customer_id === customerId);
      }

      // Separate DynamoDB costs for aggregation
      const dynamodbCosts = filteredCosts.filter(c => c.action === 'dynamodb_write');
      const otherCosts = filteredCosts.filter(c => c.action !== 'dynamodb_write');

      // Aggregate DynamoDB costs by month
      const dynamodbByMonth = {};
      dynamodbCosts.forEach(cost => {
        const date = new Date(cost.createdAt);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!dynamodbByMonth[monthKey]) {
          dynamodbByMonth[monthKey] = {
            id: `dynamodb-${monthKey}`,
            action: 'dynamodb_write',
            createdAt: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
            cost_sek: 0,
            exchange_rate: cost.exchange_rate,
            metadata: JSON.stringify({ writeCount: 0, monthLabel: monthKey }),
            isAggregated: true,
          };
        }
        dynamodbByMonth[monthKey].cost_sek += cost.cost_sek || 0;
        const meta = JSON.parse(dynamodbByMonth[monthKey].metadata);
        meta.writeCount += 1;
        dynamodbByMonth[monthKey].metadata = JSON.stringify(meta);
      });

      // Combine aggregated DynamoDB with other costs
      const aggregatedDynamodb = Object.values(dynamodbByMonth);
      const combinedCosts = [...otherCosts, ...aggregatedDynamodb];

      // Sort by date descending and limit to 100
      combinedCosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCosts(combinedCosts.slice(0, 100));
    } catch (err) {
      console.error('Failed to load usage history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId, customerId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('sv-SE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionBadge = (action) => {
    const config = ACTION_CONFIG[action] || {
      label: action,
      icon: Receipt,
      color: 'bg-gray-100 text-gray-800',
    };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const parseMetadata = (metadata) => {
    if (!metadata) return null;
    try {
      return typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
    } catch {
      return null;
    }
  };

  // Calculate totals
  const totalCost = costs.reduce((sum, c) => sum + (c.cost_sek || 0), 0);

  if (!isSuperAdmin()) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super admins can view usage history.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('admin/customers')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Användningshistorik
            </h1>
            <p className="text-muted-foreground">
              {user ? (
                <>{user.display_name || user.email} · {customer?.name || 'Okänd kund'}</>
              ) : customer ? (
                <>{customer.name}</>
              ) : (
                'Alla användare'
              )}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Uppdatera
        </Button>
      </div>

      {/* Summary */}
      {!loading && costs.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Visar senaste {costs.length} transaktioner</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Total kostnad (visade)</div>
                <div className="text-xl font-bold">{totalCost.toFixed(2)} kr</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Costs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : costs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ingen användningshistorik hittades</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Modell</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Kostnad</TableHead>
                  <TableHead className="text-right">Växelkurs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost) => {
                  const metadata = parseMetadata(cost.metadata);
                  const isAggregated = cost.isAggregated;

                  // Format month label for aggregated entries
                  const formatMonthLabel = (monthKey) => {
                    if (!monthKey) return '';
                    const [year, month] = monthKey.split('-');
                    const monthNames = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                  };

                  return (
                    <TableRow key={cost.id}>
                      <TableCell className="text-sm">
                        {isAggregated ? (
                          <span className="font-medium">{formatMonthLabel(metadata?.monthLabel)}</span>
                        ) : (
                          formatDate(cost.createdAt)
                        )}
                      </TableCell>
                      <TableCell>
                        {getActionBadge(cost.action)}
                        {isAggregated && metadata?.writeCount && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({metadata.writeCount} skrivningar)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {metadata?.model || '-'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {metadata && !isAggregated ? (
                          <span title={`In: ${metadata.promptTokens}, Ut: ${metadata.outputTokens}`}>
                            {(metadata.totalTokens || 0).toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {(cost.cost_sek || 0).toFixed(4)} kr
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {cost.exchange_rate ? `${cost.exchange_rate.toFixed(2)}` : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
