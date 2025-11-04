
import React, { useEffect, useMemo, useState } from \ react\;
import { Link } from \ react-router-dom\;
import { toast } from \ react-hot-toast\;
import RegistrStrip from \ ../components/registrstrip\;
import Footer from \ ../components/Footer\;
import {
  fetchAssociatePortalProfile,
  upsertAssociatePortalProfile,
  loadAssociateProfileDraft,
} from \ ../services/portal.js\;

const EMPTY_FORM = {
  title: \ \,
  summary: \ \,
  location: \ \,
  timezone: \ \,
  availability: \ \,
  experienceYears: \ \,
  completedProjects: \ \,
  hourlyRate: \ \,
  dailyRate: \ \,
  currency: \ USD\,
  languages: \ \,
  softwares: \ \,
  specialisations: \ \,
  certifications: \ \,
  portfolioLinks: \ \,
  keyProjects: \ \,
};

const toLineString = (value) => (Array.isArray(value) ? value.join(\ \\n\) : value || \\);
const toCommaString = (value) => (Array.isArray(value) ? value.join(\ \) : value || \\);
const splitLines = (value) => (value ? value.split(/\\r?\\n/).map((item) => item.trim()).filter(Boolean) : []);
const splitComma = (value) => (value ? value.split(/[,
]/).map((item) => item.trim()).filter(Boolean) : []);
