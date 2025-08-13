'use client';

import { useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { Upload, FileText, Zap, Loader2, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface JobDescriptionData {
  position?: string;
  department?: string;
  job_functions?: string[];
  obligations?: string[];
  prohibitions?: string[];
  requirements?: string[];
  raw_response?: string;
}

interface JobDescriptionAssistantProps {
  onDataExtracted: (data: JobDescriptionData) => void;
  currentPosition?: string;
  currentDepartment?: string;
}

export function JobDescriptionAssistant({ 
  onDataExtracted, 
  currentPosition = '',
  currentDepartment = '' 
}: JobDescriptionAssistantProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'ai'>('ai');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Estados para asistente IA
  const [aiForm, setAiForm] = useState({
    position: currentPosition,
    department: currentDepartment,
    company_type: '',
    additional_context: ''
  });

  // Estados para upload PDF
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Manejar generación IA
  const handleAIGeneration = async () => {
    if (!aiForm.position.trim()) {
      setError('El cargo es requerido para generar el descriptor');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/payroll/job-description/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiForm)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al generar descriptor');
      }

      setResult(data);
      onDataExtracted(data.data);

    } catch (err) {
      console.error('Error generating job description:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Manejar upload PDF
  const handlePDFUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/payroll/job-description/parse', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar PDF');
      }

      setResult(data);
      onDataExtracted(data.data);
      setUploadedFile(file);

    } catch (err) {
      console.error('Error parsing PDF:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Manejar drag & drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        handlePDFUpload(file);
      } else {
        setError('Solo se permiten archivos PDF');
      }
    }
  };

  // Limpiar resultados
  const clearResults = () => {
    setResult(null);
    setError(null);
    setUploadedFile(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2 text-purple-600" />
          Asistente de Descriptor de Cargo
        </CardTitle>
        <p className="text-sm text-gray-600">
          Genere automáticamente las funciones del cargo usando IA o extraiga información de un PDF
        </p>
      </CardHeader>
      <CardContent>
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'ai'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="h-4 w-4 inline mr-2" />
            Asistente IA
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'upload'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Upload className="h-4 w-4 inline mr-2" />
            Subir PDF
          </button>
        </div>

        {/* Contenido del tab activo */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cargo *
                </label>
                <input
                  type="text"
                  value={aiForm.position}
                  onChange={(e) => setAiForm(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="ej: Vendedora, Contador, Desarrollador"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={aiForm.department}
                  onChange={(e) => setAiForm(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="ej: Ventas, Contabilidad, IT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de empresa
              </label>
              <select
                value={aiForm.company_type}
                onChange={(e) => setAiForm(prev => ({ ...prev, company_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Seleccionar tipo de empresa</option>
                <option value="Retail/Comercio">Retail/Comercio</option>
                <option value="Servicios">Servicios</option>
                <option value="Manufactura">Manufactura</option>
                <option value="Construcción">Construcción</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Salud">Salud</option>
                <option value="Educación">Educación</option>
                <option value="Transporte">Transporte</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contexto adicional
              </label>
              <textarea
                value={aiForm.additional_context}
                onChange={(e) => setAiForm(prev => ({ ...prev, additional_context: e.target.value }))}
                placeholder="Describa características específicas del cargo, herramientas a usar, objetivos especiales, etc."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <Button
              onClick={handleAIGeneration}
              disabled={loading || !aiForm.position.trim()}
              variant="primary"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando descriptor...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Generar con IA
                </>
              )}
            </Button>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-purple-400 bg-purple-50' 
                  : 'border-gray-300 hover:border-purple-400'
              }`}
            >
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Arrastra tu descriptor de cargo aquí
              </p>
              <p className="text-sm text-gray-500 mb-4">
                O haz clic para seleccionar un archivo PDF
              </p>
              <input
                type="file"
                id="pdf-upload"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePDFUpload(file);
                }}
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('pdf-upload')?.click()}
                variant="outline"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analizando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar PDF
                  </>
                )}
              </Button>
            </div>

            {uploadedFile && (
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-sm text-gray-700 flex-1">{uploadedFile.name}</span>
                <Button
                  onClick={() => setUploadedFile(null)}
                  variant="ghost"
                  size="sm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Mostrar errores */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Mostrar resultados */}
        {result && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    {result.message}
                  </p>
                  {result.confidence && (
                    <p className="text-xs text-green-600">
                      Confianza: {result.confidence}%
                    </p>
                  )}
                </div>
              </div>
              <Button
                onClick={clearResults}
                variant="ghost"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="text-sm text-green-700">
              <p>✅ Funciones extraídas: {result.data.job_functions?.length || 0}</p>
              <p>✅ Obligaciones extraídas: {result.data.obligations?.length || 0}</p>
              <p>✅ Prohibiciones extraídas: {result.data.prohibitions?.length || 0}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}