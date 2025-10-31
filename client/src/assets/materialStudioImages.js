import materialStudioRecords from "../data/materialStudioRaw.json";
import img01 from "./Material_Studio_Dummy_List/01.jpg";
import img02 from "./Material_Studio_Dummy_List/02.jpg";
import img03 from "./Material_Studio_Dummy_List/03.jpg";
import img04 from "./Material_Studio_Dummy_List/04.jpg";
import img05 from "./Material_Studio_Dummy_List/05.jpg";
import img06 from "./Material_Studio_Dummy_List/06.jpg";
import img07 from "./Material_Studio_Dummy_List/07.jpg";
import img08 from "./Material_Studio_Dummy_List/08.jpg";
import img09 from "./Material_Studio_Dummy_List/09.jpg";
import img10 from "./Material_Studio_Dummy_List/10.jpg";
import img11 from "./Material_Studio_Dummy_List/11.jpg";
import img12 from "./Material_Studio_Dummy_List/12.jpg";
import img13 from "./Material_Studio_Dummy_List/13.jpg";
import img14 from "./Material_Studio_Dummy_List/14.jpg";
import img15 from "./Material_Studio_Dummy_List/15.jpg";
import img16 from "./Material_Studio_Dummy_List/16.jpg";
import img17 from "./Material_Studio_Dummy_List/17.jpg";
import img18 from "./Material_Studio_Dummy_List/18.jpg";
import img19 from "./Material_Studio_Dummy_List/19.jpg";
import img20 from "./Material_Studio_Dummy_List/20.jpg";
import img21 from "./Material_Studio_Dummy_List/21.jpg";
import img22 from "./Material_Studio_Dummy_List/22.jpg";
import img23 from "./Material_Studio_Dummy_List/23.jpg";
import img24 from "./Material_Studio_Dummy_List/24.jpg";
import img25 from "./Material_Studio_Dummy_List/25.jpg";
import img26 from "./Material_Studio_Dummy_List/26.jpg";
import img27 from "./Material_Studio_Dummy_List/27.jpg";
import img28 from "./Material_Studio_Dummy_List/28.jpg";
import img29 from "./Material_Studio_Dummy_List/29.jpg";
import img30 from "./Material_Studio_Dummy_List/30.jpg";
import img31 from "./Material_Studio_Dummy_List/31.jpg";
import img32 from "./Material_Studio_Dummy_List/32.jpg";
import img33 from "./Material_Studio_Dummy_List/33.jpg";
import img34 from "./Material_Studio_Dummy_List/34.jpg";
import img35 from "./Material_Studio_Dummy_List/35.jpg";
import img36 from "./Material_Studio_Dummy_List/36.jpg";
import img37 from "./Material_Studio_Dummy_List/37.jpg";
import img38 from "./Material_Studio_Dummy_List/38.jpg";
import img39 from "./Material_Studio_Dummy_List/39.jpg";
import img40 from "./Material_Studio_Dummy_List/40.jpg";
import img41 from "./Material_Studio_Dummy_List/41.jpg";
import img42 from "./Material_Studio_Dummy_List/42.jpg";

export const materialStudioImages = {
  1: img01,
  2: img02,
  3: img03,
  4: img04,
  5: img05,
  6: img06,
  7: img07,
  8: img08,
  9: img09,
  10: img10,
  11: img11,
  12: img12,
  13: img13,
  14: img14,
  15: img15,
  16: img16,
  17: img17,
  18: img18,
  19: img19,
  20: img20,
  21: img21,
  22: img22,
  23: img23,
  24: img24,
  25: img25,
  26: img26,
  27: img27,
  28: img28,
  29: img29,
  30: img30,
  31: img31,
  32: img32,
  33: img33,
  34: img34,
  35: img35,
  36: img36,
  37: img37,
  38: img38,
  39: img39,
  40: img40,
  41: img41,
  42: img42,
};

export const getMaterialStudioImage = (serial) => {
  const numericSerial = Number(serial);
  if (!Number.isFinite(numericSerial)) return null;
  return materialStudioImages[numericSerial] || null;
};

const slugify = (value = "", fallback = "material") => {
  const slug = String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return slug || fallback;
};

const ensureUniqueSlug = (base, seen, fallback) => {
  const seed = base || fallback;
  let candidate = seed;
  let counter = 1;
  while (seen.has(candidate)) {
    counter += 1;
    candidate = `${seed}-${counter}`;
  }
  seen.add(candidate);
  return candidate;
};

const buildSlugToImageMap = () => {
  const seen = new Set();
  const mapping = {};
  const sortedRecords = [...materialStudioRecords].sort(
    (a, b) => Number(a["S.no"] || 0) - Number(b["S.no"] || 0),
  );
  sortedRecords.forEach((record, index) => {
    const materialName = String(record.Material || "").trim();
    const brandName = String(record["Brand Name"] || "").trim();
    const titleBase =
      [brandName, materialName].filter(Boolean).join(" - ") ||
      materialName ||
      brandName ||
      `material-${index + 1}`;
    const serialNumber = Number(record["S.no"]);
    const slugBase = slugify(titleBase, `material-${serialNumber || index + 1}`);
    const slug = ensureUniqueSlug(slugBase, seen, `material-${index + 1}`);
    const image = getMaterialStudioImage(serialNumber);
    if (image) {
      mapping[slug] = image;
    }
  });
  return mapping;
};

const materialStudioImagesBySlug = buildSlugToImageMap();

export const getMaterialStudioImageBySlug = (slug) => {
  if (!slug) return null;
  return materialStudioImagesBySlug[slug] || null;
};

export const resolveMaterialStudioHero = (material) => {
  if (!material) return null;
  const serial =
    material?.metafields?.serial ??
    material?.metrics?.serial ??
    material?.metrics?.seedSourceSerial ??
    null;
  const serialImage = serial ? getMaterialStudioImage(serial) : null;
  const slugImage = material?.slug ? getMaterialStudioImageBySlug(material.slug) : null;
  if (serialImage) return serialImage;
  if (slugImage) return slugImage;
  if (material?.heroImage) return material.heroImage;
  if (Array.isArray(material?.gallery)) {
    const galleryImage = material.gallery.find(Boolean);
    if (galleryImage) return galleryImage;
  }
  if (Array.isArray(material?.images)) {
    const additionalImage = material.images.find(Boolean);
    if (additionalImage) return additionalImage;
  }
  return null;
};
