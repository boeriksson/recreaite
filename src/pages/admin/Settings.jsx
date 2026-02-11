import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings as SettingsIcon,
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw
} from 'lucide-react';
import { useCustomer } from '@/lib/CustomerContext';
import { base44, clearSettingsCache } from '@/api/amplifyClient';
import { createPageUrl } from '@/utils';

export default function Settings() {
  const { isSuperAdmin } = useCustomer();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Settings state
  const [settingsId, setSettingsId] = useState(null);
  const [usdToSekRate, setUsdToSekRate] = useState(10.50);
  const [s3PricePerGb, setS3PricePerGb] = useState(0.023);
  const [dynamodbPricePerWrite, setDynamodbPricePerWrite] = useState(0.00000125);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      const allSettings = await base44.entities.SystemSettings.list();
      const globalSettings = allSettings.find(s => s.key === 'global');

      if (globalSettings) {
        setSettingsId(globalSettings.id);
        setUsdToSekRate(globalSettings.usd_to_sek_rate || 10.50);
        setS3PricePerGb(globalSettings.s3_price_per_gb || 0.023);
        setDynamodbPricePerWrite(globalSettings.dynamodb_price_per_write || 0.00000125);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      if (settingsId) {
        // Update existing settings
        await base44.entities.SystemSettings.update(settingsId, {
          usd_to_sek_rate: usdToSekRate,
          s3_price_per_gb: s3PricePerGb,
          dynamodb_price_per_write: dynamodbPricePerWrite,
        });
      } else {
        // Create new settings record
        const newSettings = await base44.entities.SystemSettings.create({
          key: 'global',
          usd_to_sek_rate: usdToSekRate,
          s3_price_per_gb: s3PricePerGb,
          dynamodb_price_per_write: dynamodbPricePerWrite,
        });
        setSettingsId(newSettings.id);
      }

      // Clear the cached settings so new rate is used immediately
      clearSettingsCache();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin()) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only super admins can access system settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
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
              <SettingsIcon className="h-6 w-6" />
              System Settings
            </h1>
            <p className="text-muted-foreground">
              Global configuration for the system
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={loadSettings} disabled={loading}>
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

      {/* Success State */}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            Settings saved successfully!
          </AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
            <CardDescription>
              Configure exchange rates for cost calculations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="usd-to-sek">USD to SEK Exchange Rate</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">1 USD =</span>
                <Input
                  id="usd-to-sek"
                  type="number"
                  className="w-32"
                  value={usdToSekRate}
                  onChange={(e) => setUsdToSekRate(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.01"
                />
                <span className="text-muted-foreground">SEK</span>
              </div>
              <p className="text-xs text-muted-foreground">
                This rate is used when calculating costs for AI usage (image generation, LLM calls).
                The rate is applied at the time of each transaction.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="s3-price">S3 Storage Price (USD per GB/month)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="s3-price"
                  type="number"
                  className="w-32"
                  value={s3PricePerGb}
                  onChange={(e) => setS3PricePerGb(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.001"
                />
                <span className="text-muted-foreground">/ GB / month</span>
              </div>
              <p className="text-xs text-muted-foreground">
                S3 Standard pricing in eu-north-1 is ~$0.023/GB/month.
                Adjust this to include markup or match your actual costs.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="dynamodb-price">DynamoDB Write Price (USD per write unit)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="dynamodb-price"
                  type="number"
                  className="w-40"
                  value={dynamodbPricePerWrite}
                  onChange={(e) => setDynamodbPricePerWrite(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.0000001"
                />
                <span className="text-muted-foreground">/ write unit</span>
              </div>
              <p className="text-xs text-muted-foreground">
                DynamoDB on-demand pricing is ~$1.25 per million write units ($0.00000125/write).
                Each 1KB of data = 1 write unit.
              </p>
            </div>

            <div className="pt-4 border-t">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
