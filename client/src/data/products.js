
import { fallbackMaterials } from "./marketplace.js";

const productEnhancements = {
  "ultratech-opc-53": {
    "searchKeywords": [
      "opc 53",
      "ultratech",
      "high strength cement"
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80"
    ],
    "variationDimensions": [
      {
        "code": "packaging",
        "label": "Packaging",
        "values": [
          {
            "value": "25 kg bag",
            "description": "For patch and screed pours"
          },
          {
            "value": "50 kg bag",
            "description": "Standard site deployment"
          },
          {
            "value": "1 ton jumbo bag",
            "description": "Bulk silo transfer"
          }
        ]
      }
    ],
    "variations": [
      {
        "id": "opc53-25",
        "label": "25 kg bag",
        "attributes": {
          "packaging": "25 kg bag"
        },
        "price": 189,
        "currency": "INR",
        "priceUnit": "bag",
        "minQty": 80,
        "leadTimeDays": 2
      },
      {
        "id": "opc53-50",
        "label": "50 kg bag",
        "attributes": {
          "packaging": "50 kg bag"
        },
        "price": 325,
        "currency": "INR",
        "priceUnit": "bag",
        "minQty": 50,
        "leadTimeDays": 3,
        "isDefault": true
      },
      {
        "id": "opc53-1000",
        "label": "1 ton jumbo bag",
        "attributes": {
          "packaging": "1 ton jumbo bag"
        },
        "price": 6100,
        "currency": "INR",
        "priceUnit": "bag",
        "minQty": 2,
        "leadTimeDays": 5
      }
    ],
    "offers": [
      {
        "id": "offer-buildmart",
        "sellerId": "seller-buildmart",
        "sellerName": "BuildMart Logistics",
        "rating": 4.8,
        "reviewCount": 214,
        "fulfilment": "Fulfilled by Builtattic",
        "moq": 50,
        "stockStatus": "in_stock",
        "gstRegistered": true,
        "gstin": "27AAACB1234N1Z7",
        "deliveryEstimate": {
          "minDays": 2,
          "maxDays": 4
        },
        "serviceableLocations": [
          "Maharashtra",
          "Gujarat"
        ],
        "pricingByVariation": {
          "opc53-25": {
            "price": 189,
            "currency": "INR"
          },
          "opc53-50": {
            "price": 325,
            "currency": "INR"
          },
          "opc53-1000": {
            "price": 6100,
            "currency": "INR"
          }
        },
        "badges": [
          "Fast dispatch",
          "QA docs uploaded"
        ]
      },
      {
        "id": "offer-infrabuy",
        "sellerId": "seller-infrabuy",
        "sellerName": "InfraBuy Supply",
        "rating": 4.5,
        "reviewCount": 132,
        "fulfilment": "Seller fulfilled",
        "moq": 60,
        "stockStatus": "in_stock",
        "gstRegistered": true,
        "gstin": "29AAACX9981M1Z1",
        "deliveryEstimate": {
          "minDays": 3,
          "maxDays": 5
        },
        "serviceableLocations": [
          "Karnataka",
          "Tamil Nadu"
        ],
        "pricingByVariation": {
          "opc53-25": {
            "price": 192,
            "currency": "INR"
          },
          "opc53-50": {
            "price": 332,
            "currency": "INR"
          },
          "opc53-1000": {
            "price": 6260,
            "currency": "INR"
          }
        }
      },
      {
        "id": "offer-cementdirect",
        "sellerId": "seller-cementdirect",
        "sellerName": "CementDirect Fleet",
        "rating": 4.3,
        "reviewCount": 98,
        "fulfilment": "Seller fulfilled",
        "moq": 40,
        "stockStatus": "limited",
        "gstRegistered": true,
        "gstin": "24AAACD7712B1Z4",
        "deliveryEstimate": {
          "minDays": 4,
          "maxDays": 6
        },
        "serviceableLocations": [
          "Delhi NCR",
          "Rajasthan"
        ],
        "pricingByVariation": {
          "opc53-25": {
            "price": 188,
            "currency": "INR"
          },
          "opc53-50": {
            "price": 329,
            "currency": "INR"
          }
        }
      }
    ],
    "shippingBadges": [
      {
        "id": "badge-fast",
        "label": "Same-day slot",
        "description": "Dispatch window confirmed within 12 hours."
      },
      {
        "id": "badge-qa",
        "label": "QA documents",
        "description": "Batch QA auto-uploaded before handover."
      }
    ],
    "returnPolicy": {
      "windowDays": 7,
      "restockingFeePercent": 8,
      "conditions": [
        "Sealed bags only",
        "Reverse freight at actuals"
      ],
      "contactEmail": "support@builtattic.com"
    },
    "compliance": [
      "IS 12269",
      "CPWD schedule"
    ],
    "comparisonMetrics": [
      {
        "key": "compressiveStrength",
        "label": "Compressive strength (28d)",
        "unit": "MPa",
        "value": 62
      },
      {
        "key": "initialSetting",
        "label": "Initial setting",
        "unit": "minutes",
        "value": 120
      },
      {
        "key": "finalSetting",
        "label": "Final setting",
        "unit": "minutes",
        "value": 270
      }
    ],
    "faqs": [
      {
        "question": "Is freight included?",
        "answer": "Yes, metro deliveries include freight. Upload unloading notes if cranes are needed."
      },
      {
        "question": "Can I add cube testing?",
        "answer": "Select the field QA add-on to bundle cube casting supervision."
      }
    ],
    "questions": [
      {
        "id": "q-opc-01",
        "askedBy": "Rohit Mehra",
        "askedOn": "2025-02-26",
        "question": "Can the dispatch be split across two days?",
        "answeredBy": "BuildMart Ops",
        "answeredOn": "2025-02-27",
        "answer": "Yes, share preferred slot windows in checkout notes."
      }
    ],
    "reviews": [
      {
        "id": "rev-opc-01",
        "rating": 5,
        "title": "Reliable dispatch",
        "body": "QA documents were uploaded before the trucks rolled out.",
        "author": {
          "name": "Ankita Kulkarni",
          "company": "Axisline Projects",
          "location": "Raipur"
        },
        "createdAt": "2025-02-14",
        "helpful": {
          "up": 18,
          "down": 0
        }
      },
      {
        "id": "rev-opc-02",
        "rating": 4,
        "title": "Good support",
        "body": "Team clarified C3A levels quickly. Lead time exactly as promised.",
        "author": {
          "name": "Sanjay Gupta",
          "company": "InfraGrid",
          "location": "Ahmedabad"
        },
        "createdAt": "2025-01-29",
        "helpful": {
          "up": 11,
          "down": 1
        }
      }
    ],
    "subscribeOptions": [
      {
        "id": "sub-opc-monthly",
        "label": "Monthly restock",
        "discountPercent": 8,
        "cadenceDays": 30,
        "minQty": 80
      }
    ],
    "addons": [
      {
        "id": "addon-qa",
        "name": "Field QA pack",
        "description": "Cube test supervision and NABL lab reports",
        "price": 7800,
        "currency": "INR"
      }
    ],
    "documentation": [
      {
        "id": "doc-opc-tds",
        "label": "Technical data sheet",
        "url": "/docs/ultratech-opc-53-tds.pdf"
      }
    ],
    "recommendedServices": [
      {
        "ref": "assoc-rahul-iyer",
        "title": "BIM coordination",
        "justification": "Coordinate rebar shop drawings during pours."
      }
    ],
    "bestFor": [
      "High-rise columns",
      "Water retaining structures"
    ]
  },
  "fe500d-tmt-rebars": {
    "searchKeywords": [
      "fe 500d",
      "tmt bars",
      "reinforcement"
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1503387762-a6f0b2f60772?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549418920-54262316875a?auto=format&fit=crop&w=1200&q=80"
    ],
    "variationDimensions": [
      {
        "code": "diameter",
        "label": "Diameter",
        "values": [
          {
            "value": "8 mm",
            "description": "Stirrups"
          },
          {
            "value": "12 mm",
            "description": "Slabs"
          },
          {
            "value": "16 mm",
            "description": "Primary beams"
          }
        ]
      }
    ],
    "variations": [
      {
        "id": "fe500d-8",
        "label": "8 mm bundle",
        "attributes": {
          "diameter": "8 mm"
        },
        "price": 57500,
        "currency": "INR",
        "priceUnit": "metric ton",
        "minQty": 1,
        "leadTimeDays": 3,
        "isDefault": true
      },
      {
        "id": "fe500d-12",
        "label": "12 mm bundle",
        "attributes": {
          "diameter": "12 mm"
        },
        "price": 56800,
        "currency": "INR",
        "priceUnit": "metric ton",
        "minQty": 1,
        "leadTimeDays": 4
      },
      {
        "id": "fe500d-16",
        "label": "16 mm bundle",
        "attributes": {
          "diameter": "16 mm"
        },
        "price": 56200,
        "currency": "INR",
        "priceUnit": "metric ton",
        "minQty": 2,
        "leadTimeDays": 5
      }
    ],
    "offers": [
      {
        "id": "offer-steelmart",
        "sellerId": "seller-steelmart",
        "sellerName": "SteelMart Asia",
        "rating": 4.7,
        "reviewCount": 189,
        "fulfilment": "Builtattic freight",
        "moq": 2,
        "stockStatus": "in_stock",
        "gstRegistered": true,
        "gstin": "37AAICN8821P1Z7",
        "deliveryEstimate": {
          "minDays": 3,
          "maxDays": 5
        },
        "serviceableLocations": [
          "Andhra Pradesh",
          "Telangana"
        ],
        "pricingByVariation": {
          "fe500d-8": {
            "price": 57500,
            "currency": "INR"
          },
          "fe500d-12": {
            "price": 56800,
            "currency": "INR"
          },
          "fe500d-16": {
            "price": 56200,
            "currency": "INR"
          }
        },
        "badges": [
          "Cut-to-length",
          "Heat traceability"
        ]
      },
      {
        "id": "offer-metallix",
        "sellerId": "seller-metallix",
        "sellerName": "Metallix Trading",
        "rating": 4.4,
        "reviewCount": 102,
        "fulfilment": "Seller logistics",
        "moq": 1,
        "stockStatus": "in_stock",
        "gstRegistered": true,
        "gstin": "19AAKCM5522D1ZU",
        "deliveryEstimate": {
          "minDays": 4,
          "maxDays": 6
        },
        "serviceableLocations": [
          "West Bengal",
          "Jharkhand"
        ],
        "pricingByVariation": {
          "fe500d-8": {
            "price": 57900,
            "currency": "INR"
          },
          "fe500d-12": {
            "price": 57100,
            "currency": "INR"
          },
          "fe500d-16": {
            "price": 56600,
            "currency": "INR"
          }
        }
      },
      {
        "id": "offer-jsr",
        "sellerId": "seller-jsr",
        "sellerName": "JSR Steel Services",
        "rating": 4.2,
        "reviewCount": 87,
        "fulfilment": "Seller logistics",
        "moq": 3,
        "stockStatus": "limited",
        "gstRegistered": true,
        "gstin": "29AAACJ7700H1Z5",
        "deliveryEstimate": {
          "minDays": 5,
          "maxDays": 8
        },
        "serviceableLocations": [
          "Karnataka",
          "Maharashtra"
        ],
        "pricingByVariation": {
          "fe500d-16": {
            "price": 56300,
            "currency": "INR"
          }
        }
      }
    ],
    "shippingBadges": [
      {
        "id": "badge-cut",
        "label": "Cut-to-length",
        "description": "Upload BBS to schedule pre-cut bundles."
      },
      {
        "id": "badge-otp",
        "label": "Delivery OTP",
        "description": "OTP confirmation before unloading."
      }
    ],
    "returnPolicy": {
      "windowDays": 5,
      "conditions": [
        "Bundles must stay banded",
        "Cut bars non-returnable"
      ],
      "contactEmail": "steel@builtattic.com"
    },
    "compliance": [
      "IS 1786:2008",
      "IRC 112"
    ],
    "comparisonMetrics": [
      {
        "key": "yieldStrength",
        "label": "Yield strength",
        "unit": "MPa",
        "value": 520
      },
      {
        "key": "uts",
        "label": "Ultimate tensile",
        "unit": "MPa",
        "value": 620
      },
      {
        "key": "elongation",
        "label": "Elongation",
        "unit": "%",
        "value": 16
      }
    ],
    "faqs": [
      {
        "question": "Can bundles be tagged per grid?",
        "answer": "Yes, enable bundle tagging add-on during checkout."
      },
      {
        "question": "Is epoxy coating available?",
        "answer": "Request the epoxy add-on for 300 micron coating."
      }
    ],
    "questions": [
      {
        "id": "q-fe500d-01",
        "askedBy": "Vikas Patel",
        "askedOn": "2025-02-20",
        "question": "Need 12 mm bars in 10.5 m lengths. Possible?",
        "answeredBy": "SteelMart Processing",
        "answeredOn": "2025-02-20",
        "answer": "Yes, tolerance +5 mm. Add instructions in checkout."
      }
    ],
    "reviews": [
      {
        "id": "rev-fe500d-01",
        "rating": 5,
        "title": "Minimal wastage",
        "body": "Pre-cut bundles saved erection hours and heat numbers matched certificates.",
        "author": {
          "name": "Mohammed Faizal",
          "company": "ArcSpan",
          "location": "Hyderabad"
        },
        "createdAt": "2025-03-02",
        "helpful": {
          "up": 14,
          "down": 0
        }
      },
      {
        "id": "rev-fe500d-02",
        "rating": 4,
        "title": "Transparent logistics",
        "body": "Dispatch updates were timely, arrived one day later due to highway closure.",
        "author": {
          "name": "Grace Menon",
          "company": "Vertex PMC",
          "location": "Kochi"
        },
        "createdAt": "2025-02-18",
        "helpful": {
          "up": 9,
          "down": 1
        }
      }
    ],
    "subscribeOptions": [
      {
        "id": "sub-fe500d-fortnight",
        "label": "Fortnight replenishment",
        "discountPercent": 5,
        "cadenceDays": 14,
        "minQty": 2
      }
    ],
    "addons": [
      {
        "id": "addon-cut",
        "name": "Cut-to-length",
        "description": "Pre-cut and labeled bundles",
        "price": 850,
        "currency": "INR",
        "priceUnit": "per metric ton"
      }
    ],
    "documentation": [
      {
        "id": "doc-fe500d-cert",
        "label": "Sample mill certificate",
        "url": "/docs/fe500d-mill-certificate.pdf"
      }
    ],
    "recommendedServices": [
      {
        "ref": "assoc-lin-zhang",
        "title": "Thermal analysis",
        "justification": "Validate pour sequence with energy study."
      }
    ],
    "bestFor": [
      "Seismic frames",
      "Infrastructure decks"
    ]
  },
  "matte-laminate-flooring": {
    "searchKeywords": [
      "laminate",
      "flooring",
      "ac4"
    ],
    "gallery": [
      "https://images.unsplash.com/photo-1616628182508-7f5d4ec17993?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
    ],
    "variationDimensions": [
      {
        "code": "finish",
        "label": "Finish",
        "values": [
          {
            "value": "Nordic Oak",
            "description": "Light tone"
          },
          {
            "value": "Warm Walnut",
            "description": "Rich brown"
          },
          {
            "value": "Graphite Concrete",
            "description": "Neutral grey"
          }
        ]
      }
    ],
    "variations": [
      {
        "id": "laminate-oak",
        "label": "Nordic Oak",
        "attributes": {
          "finish": "Nordic Oak"
        },
        "price": 540,
        "currency": "INR",
        "priceUnit": "sq.m",
        "minQty": 200,
        "leadTimeDays": 10,
        "isDefault": true
      },
      {
        "id": "laminate-walnut",
        "label": "Warm Walnut",
        "attributes": {
          "finish": "Warm Walnut"
        },
        "price": 560,
        "currency": "INR",
        "priceUnit": "sq.m",
        "minQty": 200,
        "leadTimeDays": 12
      },
      {
        "id": "laminate-concrete",
        "label": "Graphite Concrete",
        "attributes": {
          "finish": "Graphite Concrete"
        },
        "price": 575,
        "currency": "INR",
        "priceUnit": "sq.m",
        "minQty": 220,
        "leadTimeDays": 14
      }
    ],
    "offers": [
      {
        "id": "offer-floorhub",
        "sellerId": "seller-floorhub",
        "sellerName": "FloorHub Studios",
        "rating": 4.9,
        "reviewCount": 168,
        "fulfilment": "Builtattic bonded",
        "moq": 200,
        "stockStatus": "in_stock",
        "gstRegistered": true,
        "gstin": "03AAACF2201M1Z8",
        "deliveryEstimate": {
          "minDays": 6,
          "maxDays": 9
        },
        "serviceableLocations": [
          "Singapore",
          "Malaysia"
        ],
        "pricingByVariation": {
          "laminate-oak": {
            "price": 540,
            "currency": "INR"
          },
          "laminate-walnut": {
            "price": 560,
            "currency": "INR"
          },
          "laminate-concrete": {
            "price": 575,
            "currency": "INR"
          }
        },
        "badges": [
          "Underlay bundled",
          "VOC tested"
        ]
      },
      {
        "id": "offer-surfacecraft",
        "sellerId": "seller-surfacecraft",
        "sellerName": "SurfaceCraft Asia",
        "rating": 4.6,
        "reviewCount": 94,
        "fulfilment": "Seller logistics",
        "moq": 180,
        "stockStatus": "in_stock",
        "gstRegistered": true,
        "gstin": "07AAICS7721P1Z9",
        "deliveryEstimate": {
          "minDays": 8,
          "maxDays": 11
        },
        "serviceableLocations": [
          "India",
          "Sri Lanka"
        ],
        "pricingByVariation": {
          "laminate-oak": {
            "price": 548,
            "currency": "INR"
          },
          "laminate-walnut": {
            "price": 566,
            "currency": "INR"
          },
          "laminate-concrete": {
            "price": 582,
            "currency": "INR"
          }
        }
      },
      {
        "id": "offer-vista",
        "sellerId": "seller-vista",
        "sellerName": "Vista Interiors",
        "rating": 4.3,
        "reviewCount": 71,
        "fulfilment": "Seller logistics",
        "moq": 150,
        "stockStatus": "limited",
        "gstRegistered": true,
        "gstin": "29AAACV8890F1Z0",
        "deliveryEstimate": {
          "minDays": 9,
          "maxDays": 14
        },
        "serviceableLocations": [
          "India South"
        ],
        "pricingByVariation": {
          "laminate-oak": {
            "price": 552,
            "currency": "INR"
          },
          "laminate-walnut": {
            "price": 570,
            "currency": "INR"
          }
        }
      }
    ],
    "shippingBadges": [
      {
        "id": "badge-sealed",
        "label": "Moisture sealed",
        "description": "Pallets double wrapped with desiccant."
      },
      {
        "id": "badge-install",
        "label": "Installer network",
        "description": "Certified install crews available on request."
      }
    ],
    "returnPolicy": {
      "windowDays": 14,
      "conditions": [
        "Cartons unopened",
        "Return freight deducted"
      ],
      "contactEmail": "flooring@builtattic.com"
    },
    "compliance": [
      "EN 13329 AC4",
      "E1 emissions"
    ],
    "comparisonMetrics": [
      {
        "key": "abrasion",
        "label": "Abrasion rating",
        "unit": "",
        "value": "AC4"
      },
      {
        "key": "waterResistance",
        "label": "Splash resistance",
        "unit": "hours",
        "value": 36
      },
      {
        "key": "thermalConductivity",
        "label": "Thermal conductivity",
        "unit": "W/mK",
        "value": 0.12
      }
    ],
    "faqs": [
      {
        "question": "Is underlay included?",
        "answer": "Yes, 2mm IXPE underlay ships with every order."
      },
      {
        "question": "Can it run over heating?",
        "answer": "Compatible with hydronic and electric systems up to 27?C."
      }
    ],
    "questions": [
      {
        "id": "q-laminate-01",
        "askedBy": "Claire Ng",
        "askedOn": "2025-03-01",
        "question": "Need Class Bfl-s1 certificate. Provided?",
        "answeredBy": "FloorHub Tech",
        "answeredOn": "2025-03-01",
        "answer": "Yes, fire reports are available in the documents section."
      }
    ],
    "reviews": [
      {
        "id": "rev-laminate-01",
        "rating": 5,
        "title": "Premium finish",
        "body": "Click lock installation was quick and colour matched renders.",
        "author": {
          "name": "Adrian Lim",
          "company": "Studio Forte",
          "location": "Singapore"
        },
        "createdAt": "2025-02-22",
        "helpful": {
          "up": 20,
          "down": 1
        }
      },
      {
        "id": "rev-laminate-02",
        "rating": 4,
        "title": "Good value",
        "body": "Two cartons had scuffed corners but replacements arrived next day.",
        "author": {
          "name": "Heena Shah",
          "company": "DesignChamber",
          "location": "Mumbai"
        },
        "createdAt": "2025-03-05",
        "helpful": {
          "up": 9,
          "down": 0
        }
      }
    ],
    "subscribeOptions": [
      {
        "id": "sub-laminate-care",
        "label": "Bi-annual care kit",
        "discountPercent": 12,
        "cadenceDays": 180,
        "minQty": 1
      }
    ],
    "addons": [
      {
        "id": "addon-installer",
        "name": "Installer pairing",
        "description": "Certified crew with site readiness audit",
        "price": 95,
        "currency": "INR",
        "priceUnit": "per sq.m"
      }
    ],
    "documentation": [
      {
        "id": "doc-laminate-install",
        "label": "Installation guide",
        "url": "/docs/laminate-install-guide.pdf"
      }
    ],
    "recommendedServices": [
      {
        "ref": "assoc-laia-fernandez",
        "title": "Retail visualisation",
        "justification": "Preview layouts with live parametric renders."
      }
    ],
    "bestFor": [
      "Retail fit-outs",
      "Hospitality suites"
    ]
  }
};

const mergeSpecs = (base = [], extras = []) => {
  const seen = new Map();
  [...base, ...(extras || [])].forEach((spec) => {
    if (!spec?.label) return;
    seen.set(spec.label, spec);
  });
  return Array.from(seen.values());
};

export const productCatalog = fallbackMaterials.map((material) => {
  const enhancements = productEnhancements[material.slug] || {};
  const gallery = [material.heroImage, ...(enhancements.gallery || [])].filter(Boolean);
  return {
    ...material,
    kind: "product",
    gallery,
    searchKeywords: enhancements.searchKeywords || [],
    variationDimensions: enhancements.variationDimensions || [],
    variations: enhancements.variations || [],
    offers: enhancements.offers || [],
    shippingBadges: enhancements.shippingBadges || [],
    returnPolicy: enhancements.returnPolicy || null,
    compliance: enhancements.compliance || [],
    comparisonMetrics: enhancements.comparisonMetrics || [],
    faqs: enhancements.faqs || [],
    questions: enhancements.questions || [],
    reviews: enhancements.reviews || [],
    subscribeOptions: enhancements.subscribeOptions || [],
    addons: enhancements.addons || [],
    documentation: enhancements.documentation || [],
    recommendedServices: enhancements.recommendedServices || [],
    bestFor: enhancements.bestFor || [],
    specs: mergeSpecs(material.specs, enhancements.additionalSpecs),
  };
});

export const productSearchRecords = productCatalog.map((product) => ({
  id: product._id,
  slug: product.slug,
  title: product.title,
  category: product.categories?.[0] || "General",
  tags: product.tags || [],
  keywords: [
    product.title,
    ...(product.searchKeywords || []),
    ...(product.tags || []),
    ...(product.bestFor || []),
  ].join(" ").toLowerCase(),
}));

export const productBySlug = (slug) => {
  return productCatalog.find((item) => item.slug === slug) || null;
};
