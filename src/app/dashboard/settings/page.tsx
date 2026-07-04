import React from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default async function SettingsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, coachings(name, contact_email)')
    .eq('id', user?.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
        <p className="text-slate-500">Manage your academy settings and preferences.</p>
      </div>

      <Card className="border-slate-200">
        <CardContent className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Academy Profile</h3>
          
          <div className="space-y-4">
            <Input 
              label="Academy Name" 
              defaultValue={profile?.coachings?.name || ''} 
              disabled 
            />
            <Input 
              label="Contact Email" 
              defaultValue={profile?.coachings?.contact_email || user?.email || ''} 
              disabled 
            />
            <Input 
              label="Admin Name" 
              defaultValue={profile?.name || ''} 
              disabled 
            />
          </div>
          
          <div className="pt-4">
            <Button variant="outline" disabled>Save Changes</Button>
            <p className="text-xs text-slate-400 mt-2">Note: Profile editing is restricted in this demo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
