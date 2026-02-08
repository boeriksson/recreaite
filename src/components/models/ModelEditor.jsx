import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { base44 } from '@/api/amplifyClient';

export default function ModelEditor({ model, onClose, onSave, darkMode }) {
  const [formData, setFormData] = useState({
    name: model.name || '',
    gender: model.gender || 'female',
    age: model.age || 25,
    ethnicity: model.ethnicity || 'caucasian',
    body_type: model.body_type || 'athletic',
    height: model.height || 175,
    hair_color: model.hair_color || 'blonde',
    hair_style: model.hair_style || '',
    skin_tone: model.skin_tone || 'fair',
    notes: model.notes || ''
  });
  
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewImageUrl(file_url);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData = {
        ...formData,
        ...(newImageUrl && { image_url: newImageUrl })
      };
      
      await base44.entities.Model.update(model.id, updateData);
      onSave();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl overflow-hidden max-w-4xl w-full max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${darkMode ? 'border-white/10' : 'border-black/10'}`}>
          <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-black'}`}>
            Redigera modell
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'} transition-colors`}
          >
            <X className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-black'}`} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Image Section */}
            <div>
              <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Modellbild</Label>
              <div className="mt-2 aspect-[3/4] rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 relative">
                <img 
                  src={newImageUrl || model.image_url} 
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
                <label 
                  className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="text-center">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin mx-auto" />
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-white mx-auto mb-2" />
                        <p className="text-white text-sm">Byt bild</p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-4">
              <div>
                <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Namn *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Kön</Label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={`w-full mt-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'} border`}
                  >
                    <option value="female">Kvinna</option>
                    <option value="male">Man</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>

                <div>
                  <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Ålder</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                    min="18"
                    max="60"
                    className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}
                  />
                </div>
              </div>

              <div>
                <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Etnicitet</Label>
                <select
                  value={formData.ethnicity}
                  onChange={(e) => setFormData({ ...formData, ethnicity: e.target.value })}
                  className={`w-full mt-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'} border`}
                >
                  <option value="caucasian">Kaukasisk</option>
                  <option value="african">Afrikansk</option>
                  <option value="asian">Asiatisk</option>
                  <option value="hispanic">Latinamerikansk</option>
                  <option value="middle-eastern">Mellanöstern</option>
                  <option value="mixed">Blandad</option>
                </select>
              </div>

              <div>
                <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Kroppstyp</Label>
                <select
                  value={formData.body_type}
                  onChange={(e) => setFormData({ ...formData, body_type: e.target.value })}
                  className={`w-full mt-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'} border`}
                >
                  <option value="slim">Smal</option>
                  <option value="athletic">Atletisk</option>
                  <option value="average">Genomsnittlig</option>
                  <option value="curvy">Kurvig</option>
                  <option value="plus-size">Plus-size</option>
                </select>
              </div>

              <div>
                <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Längd (cm)</Label>
                <Input
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) })}
                  min="150"
                  max="200"
                  className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Hårfärg</Label>
                  <select
                    value={formData.hair_color}
                    onChange={(e) => setFormData({ ...formData, hair_color: e.target.value })}
                    className={`w-full mt-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'} border`}
                  >
                    <option value="blonde">Blond</option>
                    <option value="brunette">Brunett</option>
                    <option value="black">Svart</option>
                    <option value="red">Röd</option>
                    <option value="gray">Grå</option>
                    <option value="colored">Färgad</option>
                  </select>
                </div>

                <div>
                  <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Hudton</Label>
                  <select
                    value={formData.skin_tone}
                    onChange={(e) => setFormData({ ...formData, skin_tone: e.target.value })}
                    className={`w-full mt-2 px-3 py-2 rounded-lg ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'} border`}
                  >
                    <option value="fair">Ljus</option>
                    <option value="light">Ljusbrun</option>
                    <option value="medium">Medium</option>
                    <option value="tan">Solbränd</option>
                    <option value="dark">Mörk</option>
                  </select>
                </div>
              </div>

              <div>
                <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Frisyr (valfritt)</Label>
                <Input
                  value={formData.hair_style}
                  onChange={(e) => setFormData({ ...formData, hair_style: e.target.value })}
                  placeholder="T.ex. långt, kort, lockigt..."
                  className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'}`}
                />
              </div>

              <div>
                <Label className={darkMode ? 'text-white/80' : 'text-black/80'}>Anteckningar (valfritt)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Lägg till anteckningar om modellen..."
                  className={`mt-2 ${darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-[#f5f5f7] border-black/10 text-black'} min-h-[80px]`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t ${darkMode ? 'border-white/10' : 'border-black/10'} flex gap-3`}>
          <Button
            onClick={onClose}
            variant="outline"
            className={`flex-1 rounded-full ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-black/10 hover:bg-black/5'}`}
          >
            Avbryt
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name || saving}
            className="flex-1 bg-[#0071e3] hover:bg-[#0077ED] text-white rounded-full"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sparar...
              </>
            ) : (
              'Spara ändringar'
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}