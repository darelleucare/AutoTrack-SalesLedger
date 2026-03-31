import { useState } from 'react';
import { useSales } from '@/store/SalesContext';
import { DEFAULT_BANK_CHECKLIST } from '@/types/sales';
import { ArrowLeft, Plus, Trash2, Edit2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChecklistEditor from '@/components/settings/ChecklistEditor';

export default function SettingsPage() {
  const { settings, updateSettings } = useSales();
  const navigate = useNavigate();
  const [newModel, setNewModel] = useState('');
  const [activeChecklistTab, setActiveChecklistTab] = useState<'accounting' | 'dealer' | 'lto'>('accounting');
  const [editingGroupIndex, setEditingGroupIndex] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Ensure groupNames exists (for backward compatibility with old data)
  const groupNames = settings.groupNames || Array.from({ length: settings.groupCount }, (_, i) => `Group ${i + 1}`);

  // Bank config state
  const [addingBank, setAddingBank] = useState(false);
  const [newBankName, setNewBankName] = useState('');
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [bankChecklist, setBankChecklist] = useState<string[]>([]);

  const addModel = () => {
    if (newModel.trim() && !settings.vehicleModels.includes(newModel.trim())) {
      updateSettings({ vehicleModels: [...settings.vehicleModels, newModel.trim()] });
      setNewModel('');
    }
  };

  const removeModel = (m: string) => {
    updateSettings({ vehicleModels: settings.vehicleModels.filter(v => v !== m) });
  };

  const startRenameGroup = (index: number) => {
    setEditingGroupIndex(index);
    setEditingGroupName(groupNames[index] || `Group ${index + 1}`);
  };

  const saveGroupName = (index: number) => {
    if (editingGroupName.trim()) {
      const newNames = [...groupNames];
      newNames[index] = editingGroupName.trim();
      updateSettings({ groupNames: newNames });
    }
    setEditingGroupIndex(null);
  };

  const updateGroupCount = (newCount: number) => {
    const count = Math.max(1, newCount || 3);
    const currentNames = [...groupNames];
    
    // Expand or trim names array to match count
    while (currentNames.length < count) {
      currentNames.push(`Group ${currentNames.length + 1}`);
    }
    if (currentNames.length > count) {
      currentNames.length = count;
    }
    
    updateSettings({ groupCount: count, groupNames: currentNames });
  };

  const toggleTheme = (theme: 'light' | 'dark') => {
    updateSettings({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  };

  // Bank checklist handlers
  const startAddBank = () => {
    setAddingBank(true);
    setNewBankName('');
  };

  const confirmNewBank = () => {
    const name = newBankName.trim();
    if (!name || settings.bankChecklists[name]) return;
    setBankChecklist([...DEFAULT_BANK_CHECKLIST]);
    setEditingBank(name);
    setAddingBank(false);
    setNewBankName('');
  };

  const startEditBank = (name: string) => {
    setBankChecklist([...(settings.bankChecklists[name] || [])]);
    setEditingBank(name);
  };

  const saveBankChecklist = () => {
    if (editingBank) {
      updateSettings({
        bankChecklists: { ...settings.bankChecklists, [editingBank]: bankChecklist },
      });
      setEditingBank(null);
    }
  };

  const deleteBank = (name: string) => {
    const updated = { ...settings.bankChecklists };
    delete updated[name];
    updateSettings({ bankChecklists: updated });
    if (editingBank === name) setEditingBank(null);
  };

  const bankNames = Object.keys(settings.bankChecklists);

  return (
    <div className="min-h-screen bg-web-bg p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <h1 className="text-xl font-bold mb-6">⚙️ System Settings</h1>

      {/* Theme */}
      <div className="border border-border rounded p-4 mb-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">System Theme</h3>
        <div className="flex gap-2">
          {(['light', 'dark'] as const).map(t => (
            <button
              key={t}
              onClick={() => toggleTheme(t)}
              className={`px-4 py-1.5 text-sm rounded capitalize ${settings.theme === t ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Date Format */}
      <div className="border border-border rounded p-4 mb-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Date Format</h3>
        <div className="flex gap-2 mb-3">
          {([
            { key: 'us', label: 'US (MM/DD/YYYY)' },
            { key: 'eur', label: 'EUR (DD/MM/YYYY)' },
            { key: 'jpn', label: 'JPN (YYYY/MM/DD)' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => updateSettings({ dateFormat: f.key })}
              className={`px-3 py-1.5 text-xs rounded ${settings.dateFormat === f.key ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['short', 'long'] as const).map(l => (
            <button
              key={l}
              onClick={() => updateSettings({ dateLength: l })}
              className={`px-3 py-1.5 text-xs rounded capitalize ${settings.dateLength === l ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'}`}
            >
              {l} {l === 'short' ? '(01/01/2000)' : '(Jan 01, 2000)'}
            </button>
          ))}
        </div>
      </div>

      {/* Group Configuration */}
      <div className="border border-border rounded p-4 mb-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Group Configuration</h3>
        
        {/* Group Count Input */}
        <div className="mb-4">
          <label className="text-xs text-muted-foreground mb-2 block">Number of Groups</label>
          <input
            type="number"
            min={1}
            max={10}
            className="border border-border rounded px-3 py-1.5 text-sm bg-background w-20"
            value={settings.groupCount}
            onChange={e => updateGroupCount(Number(e.target.value))}
          />
        </div>

        {/* Group Names */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block font-medium">Group Names</label>
          <div className="space-y-2">
            {groupNames.map((name, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 rounded border border-border bg-muted/50">
                {editingGroupIndex === idx ? (
                  <>
                    <input
                      autoFocus
                      type="text"
                      className="flex-1 border border-border rounded px-2 py-1 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                      value={editingGroupName}
                      onChange={e => setEditingGroupName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveGroupName(idx)}
                    />
                    <button
                      onClick={() => saveGroupName(idx)}
                      className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingGroupIndex(null)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{name}</span>
                    <button
                      onClick={() => startRenameGroup(idx)}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle Models */}
      <div className="border border-border rounded p-4 mb-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Vehicle Models</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {settings.vehicleModels.map(m => (
            <span key={m} className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm">
              {m}
              <button onClick={() => removeModel(m)} className="hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="border border-border rounded px-2 py-1.5 text-sm bg-background flex-1"
            placeholder="New model name"
            value={newModel}
            onChange={e => setNewModel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addModel()}
          />
          <button onClick={addModel} className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90">
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Checklists Configuration */}
      <div className="border border-border rounded p-4 mb-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Checklists Configuration</h3>
        <p className="text-xs text-muted-foreground mb-3">Manage the document checklists for Accounting, Dealer, and LTO.</p>
        <div className="flex gap-1 mb-3">
          {(['accounting', 'dealer', 'lto'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveChecklistTab(tab)}
              className={`px-3 py-1.5 text-xs rounded font-medium transition-colors ${
                activeChecklistTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <ChecklistEditor
          items={
            activeChecklistTab === 'accounting'
              ? settings.accountingDocs
              : activeChecklistTab === 'dealer'
              ? settings.dealerDocs
              : settings.ltoDocs
          }
          onChange={(items) => {
            if (activeChecklistTab === 'accounting') updateSettings({ accountingDocs: items });
            else if (activeChecklistTab === 'dealer') updateSettings({ dealerDocs: items });
            else updateSettings({ ltoDocs: items });
          }}
          showBankRequired={activeChecklistTab === 'accounting' || activeChecklistTab === 'dealer'}
          bankRequiredItems={
            activeChecklistTab === 'accounting'
              ? settings.accountingBankRequired
              : activeChecklistTab === 'dealer'
              ? settings.dealerBankRequired
              : undefined
          }
          onBankRequiredChange={(items) => {
            if (activeChecklistTab === 'accounting') updateSettings({ accountingBankRequired: items });
            else if (activeChecklistTab === 'dealer') updateSettings({ dealerBankRequired: items });
          }}
        />
      </div>

      {/* Banks Checklist Configuration */}
      <div className="border border-border rounded p-4 bg-card">
        <h3 className="text-sm font-semibold mb-3">Banks Checklist Configuration</h3>
        <p className="text-xs text-muted-foreground mb-3">Configure per-bank document checklists. These are used when adding a new sale with a specific bank.</p>

        {/* Bank list */}
        {bankNames.length === 0 && !addingBank && !editingBank && (
          <p className="text-xs text-muted-foreground py-3 text-center border border-dashed border-border rounded mb-3">
            No banks configured yet. Add one to get started.
          </p>
        )}

        <div className="space-y-1 mb-3">
          {bankNames.map(name => (
            <div
              key={name}
              className={`flex items-center gap-2 px-3 py-2 rounded border transition-colors ${
                editingBank === name ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/50'
              }`}
            >
              {editingBank === name ? (
                <ChevronDown className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="flex-1 text-sm font-medium">{name}</span>
              <span className="text-xs text-muted-foreground">{settings.bankChecklists[name].length} items</span>
              <button
                onClick={() => editingBank === name ? setEditingBank(null) : startEditBank(name)}
                className="p-1 hover:bg-accent rounded"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => deleteBank(name)}
                className="p-1 hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Editing bank checklist */}
        {editingBank && (
          <div className="border border-primary/30 rounded p-3 mb-3 bg-primary/5">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">Editing: {editingBank}</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingBank(null)}
                  className="px-3 py-1 text-xs border border-border rounded hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBankChecklist}
                  className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
            <ChecklistEditor items={bankChecklist} onChange={setBankChecklist} />
          </div>
        )}

        {/* Adding new bank */}
        {addingBank ? (
          <div className="border border-border rounded p-3 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Bank Name</label>
            <div className="flex gap-2">
              <input
                autoFocus
                className="flex-1 border border-border rounded px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="Enter bank name..."
                value={newBankName}
                onChange={e => setNewBankName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && confirmNewBank()}
              />
              <button
                onClick={confirmNewBank}
                disabled={!newBankName.trim() || !!settings.bankChecklists[newBankName.trim()]}
                className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50"
              >
                Continue
              </button>
              <button
                onClick={() => setAddingBank(false)}
                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-accent"
              >
                Cancel
              </button>
            </div>
            {newBankName.trim() && settings.bankChecklists[newBankName.trim()] && (
              <p className="text-xs text-destructive">This bank already exists.</p>
            )}
          </div>
        ) : (
          <button
            onClick={startAddBank}
            className="flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-border rounded hover:bg-accent w-full justify-center transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Bank
          </button>
        )}
      </div>
    </div>
  );
}
