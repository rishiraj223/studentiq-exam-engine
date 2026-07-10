'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Building2, User, Phone, Mail, MapPin, Calendar, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import ConvertLeadModal from './ConvertLeadModal';

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [convertTarget, setConvertTarget] = useState<any>(null);
  const supabase = createClient();

  const fetchLeads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('demo_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const handleConverted = (leadId: string) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, converted_to_institute: true } : l));
    setConvertTarget(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Management</h1>
          <p className="text-slate-500 mt-1">Review demo requests from Institutes and Students.</p>
        </div>
        <div className="text-sm text-slate-500">
          {leads.length} total leads
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : leads.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          No demo requests found yet.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leads.map((lead) => (
            <Card key={lead.id} className={`border-slate-200 overflow-hidden flex flex-col ${lead.converted_to_institute ? 'opacity-75' : ''}`}>
              <div className={`h-1.5 w-full ${lead.user_type === 'institute' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>

              <CardHeader className="pb-2 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 leading-tight">{lead.name}</h3>
                    <div className="flex items-center gap-1 text-slate-500 text-sm mt-1">
                      {lead.user_type === 'institute' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      <span className="capitalize">{lead.user_type}</span>
                    </div>
                  </div>
                  {lead.converted_to_institute ? (
                    <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Converted
                    </span>
                  ) : (
                    <Badge variant={lead.user_type === 'institute' ? 'info' : 'default'}>
                      {lead.user_type === 'institute' ? 'Institute' : 'Student'}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-2.5 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`mailto:${lead.email}`} className="hover:text-blue-600 truncate">{lead.email}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <a href={`tel:${lead.phone}`} className="hover:text-blue-600">{lead.phone}</a>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  {lead.city}
                </div>

                {lead.user_type === 'institute' && lead.students_count && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    Students: <span className="font-medium">{lead.students_count}</span>
                  </div>
                )}

                {lead.user_type === 'student' && lead.standard && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    Standard: <span className="font-medium">{lead.standard}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-100">
                  <Calendar className="w-3 h-3" />
                  {new Date(lead.created_at).toLocaleString()}
                </div>

                {/* Convert to Account — for all leads not yet converted */}
                {!lead.converted_to_institute && (
                  <button
                    onClick={() => setConvertTarget(lead)}
                    className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-sm font-semibold border border-emerald-200 transition-colors"
                  >
                    <ArrowRightCircle className="w-4 h-4" />
                    Convert to {lead.user_type === 'student' ? 'Student' : 'Institute'}
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Convert Modal */}
      {convertTarget && (
        <ConvertLeadModal
          lead={convertTarget}
          onClose={() => setConvertTarget(null)}
          onConverted={handleConverted}
        />
      )}
    </div>
  );
}
