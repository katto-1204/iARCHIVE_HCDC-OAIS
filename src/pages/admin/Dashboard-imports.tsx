import * as React from "react";
import { AdminLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Badge } from "@/components/ui-components";
import { CompletionRing } from "@/components/CompletionRing";
import { Barcode } from "@/components/Barcode";
import {
  Database, CheckCircle2, BarChart3, TrendingUp, ShieldCheck,
  ChevronDown, ChevronUp, Clock, Upload, Edit3, Shield,
  AlertCircle, XCircle, FileText, Activity, Filter, Lock,
  Mail, MessageSquare, Trash2, Info, Sparkles, CheckCircle
} from "lucide-react";
import { Link } from "wouter";
import { type ArchivalMaterial } from "@/data/sampleData";
import { getMaterials, getActivityFeed, getFeedbacks, markFeedbackAsRead } from "@/data/storage";
import {
  computeCompletion, computeISADGCompletion, computeDCCompletion,
  computeAreaBreakdown, getEssentialFieldsStatus, getAllFieldValues,
  getCompletionColor, getCompletionCategory, checkOAISCompliance,
  computeDashboardStats,
} from "@/data/metadataUtils";
import { format } from "date-fns";

type FilterTab = "all" | "complete" | "partial" | "incomplete";
type DashboardView = "dashboard" | "feedback";
