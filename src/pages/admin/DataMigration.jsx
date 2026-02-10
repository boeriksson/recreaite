import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2, Database, Users, RefreshCw } from 'lucide-react';
import { runMigration, checkMigrationStatus } from '@/lib/migrateToMultiTenant';
import { useCustomer } from '@/lib/CustomerContext';

export default function DataMigration() {
  const { userProfile } = useCustomer();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const result = await checkMigrationStatus();
      setStatus(result);
    } catch (error) {
      console.error('Failed to check status:', error);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleRunMigration = async () => {
    if (!confirm('This will backfill customer_id on all existing records. Continue?')) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      const result = await runMigration();
      setMigrationResult(result);
      // Refresh status after migration
      await loadStatus();
    } catch (error) {
      setMigrationResult({ errors: [{ general: error.message }] });
    } finally {
      setMigrating(false);
    }
  };

  // Check if user is super admin
  if (!userProfile?.is_super_admin) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super admins can access data migration tools.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const needsMigration = status && !status.error && (
    !status.hasDefaultCustomer ||
    !status.currentUserHasProfile ||
    Object.values(status.recordsNeedingMigration || {}).some(m => m.needsUpdate > 0)
  );

  const totalNeedingUpdate = status?.recordsNeedingMigration
    ? Object.values(status.recordsNeedingMigration)
        .reduce((sum, m) => sum + (m.needsUpdate || 0), 0)
    : 0;

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Data Migration</h1>
          <p className="text-muted-foreground">
            Multi-tenant migration: Backfill customer_id on existing records
          </p>
        </div>
        <Button variant="outline" onClick={loadStatus} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Migration Status
          </CardTitle>
          <CardDescription>
            Current state of multi-tenant data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking status...
            </div>
          ) : status?.error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{status.error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Customer Status */}
              <div className="flex items-center gap-3">
                {status.hasDefaultCustomer ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Default Customer</span>
                {status.hasDefaultCustomer && (
                  <Badge variant="secondary">{status.customerId}</Badge>
                )}
              </div>

              {/* User Profile Status */}
              <div className="flex items-center gap-3">
                {status.currentUserHasProfile ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <span>Your UserProfile</span>
              </div>

              {/* Records Status */}
              <div className="pt-2 border-t">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Records by Model
                </h4>
                <div className="grid gap-2">
                  {Object.entries(status.recordsNeedingMigration || {}).map(([model, data]) => (
                    <div key={model} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{model}</span>
                      {data.error ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : data.needsUpdate > 0 ? (
                        <Badge variant="warning" className="bg-yellow-500">
                          {data.needsUpdate} / {data.total} need update
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {data.total} OK
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Migration Action */}
      {!loading && status && !status.error && (
        <Card>
          <CardHeader>
            <CardTitle>Run Migration</CardTitle>
            <CardDescription>
              {needsMigration
                ? `${totalNeedingUpdate} records need customer_id backfilled`
                : 'All records have been migrated'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {needsMigration ? (
              <Button
                onClick={handleRunMigration}
                disabled={migrating}
                className="w-full"
              >
                {migrating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Migrating...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    Run Migration
                  </>
                )}
              </Button>
            ) : (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Migration complete! All records have customer_id set.
                </AlertDescription>
              </Alert>
            )}

            {/* Migration Results */}
            {migrationResult && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium">Migration Results</h4>

                {migrationResult.customer && (
                  <div className="text-sm">
                    Customer: {migrationResult.customer.created ? 'Created' : 'Existed'} ({migrationResult.customer.id})
                  </div>
                )}

                {migrationResult.userProfile && (
                  <div className="text-sm">
                    UserProfile: {migrationResult.userProfile.created ? 'Created' : 'Existed'}
                    {migrationResult.userProfile.isFirstUser && ' (Super Admin)'}
                  </div>
                )}

                {Object.entries(migrationResult.backfilled || {}).map(([model, data]) => (
                  <div key={model} className="text-sm">
                    {model}: {data.updated} / {data.total} updated
                  </div>
                ))}

                {migrationResult.errors?.length > 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>
                      {migrationResult.errors.length} errors occurred.
                      Check console for details.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
