
import { fallbackAssociates } from "./marketplace.js";

export const associateEnhancements = {
  "assoc-rahul-iyer": {
    "serviceBadges": [
      "Background verified",
      "BIM 360 certified",
      "30-day rework"
    ],
    "booking": {
      "leadTimeHours": 24,
      "rescheduleWindowHours": 6,
      "cancelWindowHours": 12,
      "bufferMinutes": 15,
      "timezones": [
        "Asia/Kolkata",
        "Asia/Dubai"
      ],
      "slots": [
        {
          "date": "2025-03-18",
          "start": "09:00",
          "end": "10:30",
          "type": "virtual"
        },
        {
          "date": "2025-03-18",
          "start": "15:00",
          "end": "17:00",
          "type": "on-site"
        },
        {
          "date": "2025-03-19",
          "start": "11:00",
          "end": "13:00",
          "type": "virtual"
        }
      ],
      "etaStages": [
        {
          "stage": "assigned",
          "label": "Pro assigned"
        },
        {
          "stage": "en_route",
          "label": "En route"
        },
        {
          "stage": "started",
          "label": "Session started"
        },
        {
          "stage": "completed",
          "label": "Completed"
        }
      ],
      "otpRequired": true,
      "communications": {
        "chat": true,
        "voice": true,
        "video": true
      }
    },
    "warranty": {
      "durationDays": 30,
      "coverage": "One follow-up coordination sprint",
      "contact": "success@builtattic.com"
    },
    "addons": [
      {
        "id": "addon-extra-hours",
        "name": "Additional 2 hours",
        "price": 90,
        "currency": "INR"
      },
      {
        "id": "addon-night",
        "name": "Night shift coverage",
        "price": 140,
        "currency": "INR"
      }
    ],
    "prepChecklist": [
      "Upload latest federated model",
      "Provide clash matrix if available",
      "Invite to coordination Teams channel"
    ],
    "cover": "https://images.unsplash.com/photo-1503389152951-9f343605f61c?auto=format&fit=crop&w=1600&q=80",
    "profile": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
    "type": "BIM Coordination",
    "bio": "Rahul orchestrates federated BIM models for complex hospitality and transit campuses, balancing clash resolution with contractor-ready documentation.",
    "portfolioImages": [
      "https://images.unsplash.com/photo-1529429617124-aee711a36b43?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=900&q=80"
    ],
    "workHistory": [
      {
        "role": "BIM Lead",
        "company": "Azure Marina Mixed-Use, Dubai",
        "duration": "2023 - Present",
        "description": "Delivered LOD 400 federated model with 1,200 clashes resolved before tender."
      },
      {
        "role": "Coordination Specialist",
        "company": "Transit Hub Redevelopment, Bengaluru",
        "duration": "2022 - 2023",
        "description": "Ran weekly Navisworks review and issued contractor-ready redlines."
      },
      {
        "role": "BIM Coordinator",
        "company": "Royal Meridian Tower",
        "duration": "2019 - 2022",
        "description": "Managed subcontractor model onboarding and QA on a 65-storey hospitality tower."
      }
    ]
  },
"assoc-nova-chen": {
  "serviceBadges": ["Computational toolkit", "Facade QA", "Rapid variants"],
  "booking": {
    "leadTimeHours": 12,
    "rescheduleWindowHours": 4,
    "cancelWindowHours": 8,
    "bufferMinutes": 10,
    "timezones": ["Asia/Singapore", "Asia/Hong_Kong"],
    "slots": [
      { "date": "2025-03-21", "start": "08:00", "end": "10:00", "type": "virtual" },
      { "date": "2025-03-22", "start": "14:00", "end": "17:00", "type": "virtual" }
    ],
    "etaStages": [
      { "label": "Brief upload", "minutes": 15 },
      { "label": "Variant generation", "minutes": 90 },
      { "label": "QA + delivery", "minutes": 45 }
    ]
  },
  "deliverables": [
    "Facade rationalisation report",
    "Grasshopper definition",
    "Variant catalogue (PDF)"
  ],
  "cover": "https://images.unsplash.com/photo-1473862170181-852d9b41bd4b?auto=format&fit=crop&w=1600&q=80",
  "profile": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80",
  "type": "Computational Design",
  "bio": "Nova scripts adaptive facade systems and generative studies for fast-moving commercial towers across APAC.",
  "portfolioImages": [
    "https://images.unsplash.com/photo-1505842465776-3acb7ecf8f52?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1526481280695-3c469928b67b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1529429617124-aee711a36b43?auto=format&fit=crop&w=900&q=80"
  ],
  "workHistory": [
    {
      "role": "Parametric Lead",
      "company": "Helix Pavilion, Shenzhen",
      "duration": "2022",
      "description": "Generated 46 facade variants with fabrication-ready CNC panel schedules."
    },
    {
      "role": "Computational Designer",
      "company": "Aurora Tower Visualisation, Manila",
      "duration": "2023",
      "description": "Built Grasshopper-based daylight optimisation integrated with Unreal renders."
    },
    {
      "role": "Design Technologist",
      "company": "Horizon Innovation Park",
      "duration": "2020 - 2021",
      "description": "Authored parametric library enabling rapid core-shell permutations for leasing pitches."
    }
  ]
},
"assoc-samira-khan": {
  "serviceBadges": ["XR ready", "Render farm", "Next-day previews"],
  "booking": {
    "leadTimeHours": 24,
    "rescheduleWindowHours": 12,
    "cancelWindowHours": 24,
    "bufferMinutes": 20,
    "timezones": ["Asia/Dubai", "Europe/London"],
    "slots": [
      { "date": "2025-03-24", "start": "11:00", "end": "15:00", "type": "virtual" },
      { "date": "2025-03-25", "start": "10:00", "end": "18:00", "type": "on-site" }
    ],
    "etaStages": [
      { "label": "Brief sync", "minutes": 30 },
      { "label": "Storyboard", "minutes": 120 },
      { "label": "Render delivery", "minutes": 240 }
    ]
  },
  "deliverables": [
    "Hero still renders",
    "8k animation shots",
    "Interactive walkthrough"
  ],
  "cover": "https://images.unsplash.com/photo-1529429617124-aee711a36b43?auto=format&fit=crop&w=1600&q=80",
  "profile": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  "type": "Visualization",
  "bio": "Samira leads cinematic visualization pipelines for hospitality and luxury residential towers, delivering XR-ready assets overnight.",
  "portfolioImages": [
    "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1526481280695-3c469928b67b?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80"
  ],
  "workHistory": [
    {
      "role": "Visualization Lead",
      "company": "Mirage Resort, Doha",
      "duration": "2024",
      "description": "Delivered 16k cinematic flythrough and VR suites for investor launch."
    },
    {
      "role": "Senior Visualizer",
      "company": "Skyline Residences, Dubai",
      "duration": "2022 - 2023",
      "description": "Directed storytelling renders and AR layers for sales enablement."
    },
    {
      "role": "CG Artist",
      "company": "Marina Creek Mixed-Use",
      "duration": "2019 - 2021",
      "description": "Developed realtime walkthrough assets and holographic lobby previews."
    }
  ]
},
"assoc-luis-fernandez": {
  "serviceBadges": ["Contractor network", "HSE trained", "Logistics dashboard"],
  "booking": {
    "leadTimeHours": 36,
    "rescheduleWindowHours": 12,
    "cancelWindowHours": 24,
    "bufferMinutes": 30,
    "timezones": ["America/Mexico_City", "America/Bogota"],
    "slots": [
      { "date": "2025-03-20", "start": "07:00", "end": "11:00", "type": "on-site" },
      { "date": "2025-03-21", "start": "13:00", "end": "17:00", "type": "virtual" }
    ],
    "etaStages": [
      { "label": "Site brief", "minutes": 45 },
      { "label": "Logistics mapping", "minutes": 180 },
      { "label": "Report wrap-up", "minutes": 60 }
    ]
  },
  "deliverables": [
    "Delivery readiness scorecard",
    "Crew mobilisation plan",
    "Safety audit log"
  ],
  "cover": "https://images.unsplash.com/photo-1529429617124-aee711a36b43?auto=format&fit=crop&w=1600&q=80",
  "profile": "https://images.unsplash.com/photo-1522556189639-b150ed9c4330?auto=format&fit=crop&w=600&q=80",
  "type": "Site Logistics",
  "bio": "Luis builds site logistics roadmaps for megaprojects, aligning contractor fleets, laydown yards, and safety KPIs before ground-break.",
  "portfolioImages": [
    "https://images.unsplash.com/photo-1508385082359-f38ae991e8f2?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1508898578281-774ac4893c0f?auto=format&fit=crop&w=900&q=80"
  ],
  "workHistory": [
    {
      "role": "Logistics Coordinator",
      "company": "Nuevo Oriente Airport Expansion",
      "duration": "2023 - Present",
      "description": "Implemented IoT-enabled material tracking reducing idle laydown by 28%."
    },
    {
      "role": "Operations Planner",
      "company": "Pacific Mall Redevelopment",
      "duration": "2021 - 2022",
      "description": "Authored crew mobilisation playbooks and weekly delivery dashboards."
    },
    {
      "role": "Site Superintendent",
      "company": "Sierra Residential Cluster",
      "duration": "2018 - 2020",
      "description": "Managed multi-trade logistics, cutting on-site congestion metrics in half."
    }
  ]
},
  "assoc-laia-fernandez": {
    "serviceBadges": [
      "Grasshopper specialist",
      "AR asset ready",
      "30-day support"
    ],
    "booking": {
      "leadTimeHours": 48,
      "rescheduleWindowHours": 12,
      "cancelWindowHours": 24,
      "bufferMinutes": 20,
      "timezones": [
        "Europe/Madrid",
        "UTC"
      ],
      "slots": [
        {
          "date": "2025-03-19",
          "start": "10:00",
          "end": "13:00",
          "type": "virtual"
        },
        {
          "date": "2025-03-20",
          "start": "16:00",
          "end": "18:00",
          "type": "virtual"
        },
        {
          "date": "2025-03-21",
          "start": "11:00",
          "end": "14:00",
          "type": "virtual"
        }
      ],
      "etaStages": [
        {
          "stage": "assigned",
          "label": "Designer assigned"
        },
        {
          "stage": "in_discovery",
          "label": "Discovery workshop"
        },
        {
          "stage": "asset_build",
          "label": "Asset build"
        },
        {
          "stage": "handoff",
          "label": "Handoff"
        }
      ],
      "otpRequired": false,
      "communications": {
        "chat": true,
        "voice": true,
        "video": true
      }
    },
    "warranty": {
      "durationDays": 30,
      "coverage": "Design iteration support",
      "contact": "studio@builtattic.com"
    },
    "addons": [
      {
        "id": "addon-vr",
        "name": "VR walkthrough",
        "price": 320,
        "currency": "INR"
      },
      {
        "id": "addon-branding",
        "name": "Brand guidelines sync",
        "price": 180,
        "currency": "INR"
      }
    ],
    "prepChecklist": [
      "Share Rhino base file or DWG",
      "Upload mood board references",
      "Confirm render engine preference"
    ],
    "cover": "https://images.unsplash.com/photo-1533000971552-6a962ff0b9d7?auto=format&fit=crop&w=1600&q=80",
    "profile": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80",
    "type": "Computational Design",
    "bio": "Laia blends computational geometry and product-ready visualisation to help studios pitch daring facades without sacrificing constructability.",
    "portfolioImages": [
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1495259839543-5f8ff3818092?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=900&q=80"
    ],
    "workHistory": [
      {
        "role": "Computational Designer",
        "company": "Helix Pavilion, Barcelona",
        "duration": "2022 - 2023",
        "description": "Scripted double-curved facade panels with AR assembly sequencing."
      },
      {
        "role": "Design Technologist",
        "company": "Lumen Cultural Center",
        "duration": "2020 - 2022",
        "description": "Built generative interior layouts and corresponding marketing renders."
      },
      {
        "role": "Visualization Artist",
        "company": "Nordic HQ Competition",
        "duration": "2018 - 2020",
        "description": "Produced VR-ready pitch assets that helped secure the client shortlist."
      }
    ]
  },
  "assoc-lin-zhang": {
    "serviceBadges": [
      "LEED AP",
      "IES VE certified",
      "30-day rework"
    ],
    "booking": {
      "leadTimeHours": 36,
      "rescheduleWindowHours": 12,
      "cancelWindowHours": 18,
      "bufferMinutes": 30,
      "timezones": [
        "Asia/Singapore",
        "Australia/Perth"
      ],
      "slots": [
        {
          "date": "2025-03-18",
          "start": "14:00",
          "end": "16:00",
          "type": "virtual"
        },
        {
          "date": "2025-03-19",
          "start": "09:00",
          "end": "11:00",
          "type": "virtual"
        },
        {
          "date": "2025-03-20",
          "start": "15:00",
          "end": "17:30",
          "type": "virtual"
        }
      ],
      "etaStages": [
        {
          "stage": "assigned",
          "label": "Analyst assigned"
        },
        {
          "stage": "preprocessing",
          "label": "Model preprocessing"
        },
        {
          "stage": "simulation",
          "label": "Simulation running"
        },
        {
          "stage": "report",
          "label": "Report ready"
        }
      ],
      "otpRequired": false,
      "communications": {
        "chat": true,
        "voice": true,
        "video": true
      }
    },
    "warranty": {
      "durationDays": 30,
      "coverage": "Follow-up simulation recalibration",
      "contact": "energy@builtattic.com"
    },
    "addons": [
      {
        "id": "addon-on-site",
        "name": "On-site audit",
        "price": 680,
        "currency": "SGD"
      },
      {
        "id": "addon-report",
        "name": "Regulatory submission pack",
        "price": 420,
        "currency": "SGD"
      }
    ],
    "prepChecklist": [
      "Upload BIM model or gbXML",
      "List envelope specifications",
      "Provide climate file"
    ],
    "cover": "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    "profile": "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80",
    "type": "Sustainability",
    "bio": "Lin models high-performance envelopes, translating simulation output into pragmatic retrofit roadmaps for dense urban towers.",
    "portfolioImages": [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=900&q=80"
    ],
    "workHistory": [
      {
        "role": "Lead Analyst",
        "company": "Harbourfront Innovation Hub",
        "duration": "2023",
        "description": "Ran energy + daylight simulations achieving 18% HVAC load reduction."
      },
      {
        "role": "Sustainability Consultant",
        "company": "Skyline Residences Retrofit",
        "duration": "2022",
        "description": "Delivered LEED Gold documentation and envelope tuning roadmap."
      },
      {
        "role": "Building Performance Analyst",
        "company": "Pacific Medical Campus",
        "duration": "2019 - 2021",
        "description": "Guided passive strategies and MEP rightsizing for a 1.2M sq.ft campus."
      }
    ]
  }
};

export const associateCatalog = fallbackAssociates.map((associate) => {
  const extras = associateEnhancements[associate._id] || {};
  return {
    ...associate,
    serviceBadges: extras.serviceBadges || [],
    booking: extras.booking || null,
    warranty: extras.warranty || null,
    addons: extras.addons || [],
    prepChecklist: extras.prepChecklist || [],
    cover: extras.cover || associate.cover || null,
    profile: extras.profile || associate.profile || null,
    type: extras.type || associate.type || null,
    bio: extras.bio || associate.bio || associate.summary,
    portfolioImages: extras.portfolioImages || associate.portfolioImages || [],
    workHistory: extras.workHistory || associate.workHistory || [],
    priceLabel: extras.priceLabel || associate.priceLabel || null,
    deliverables: extras.deliverables || associate.deliverables || [],
  };
});

export const associateById = (id) => {
  return associateCatalog.find((associate) => associate._id === id) || null;
};
