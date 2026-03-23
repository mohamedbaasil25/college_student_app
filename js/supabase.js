// Initialize Supabase Client
const SUPABASE_URL = "https://tgsegzbzyybwufcfvfju.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc2VnemJ6eXlid3VmY2Z2Zmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyMzYwODYsImV4cCI6MjA4OTgxMjA4Nn0.9RE3xFAVoa9B04Jev6dzqCa0CfRc3-noj2PeTwq0IXQ";

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
