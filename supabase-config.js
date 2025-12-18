// Configuración de Supabase
const SUPABASE_URL = 'https://pqcbolifroybicuzqhwa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxY2JvbGlmcm95YmljdXpxaHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MjA2OTgsImV4cCI6MjA3OTQ5NjY5OH0.8MEyzHmlLNv6t79czvfpDMOMArCEbiWoGluHTM_zl7o';

// Inicializar cliente de Supabase (usando var para evitar conflictos de redeclaración)
var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
