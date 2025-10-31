import AccessRequest, { ACCESS_ROLE_OPTIONS } from '../models/AccessRequest.js';

export const createAccessRequest = async (req, res) => {
  try {
    const {
      name,
      contact,
      pincode,
      country,
      role,
      isContributor,
      secretCode,
    } = req.body || {};

    if (!name || !contact || !pincode || !country || !role || !secretCode) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const contactValue = String(contact).trim();
    const contactDigits = contactValue.replace(/[^0-9]/g, '');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailPattern.test(contactValue.toLowerCase());
    if (!isEmail && contactDigits.length < 6) {
      return res.status(400).json({ message: 'Invalid contact information provided.' });
    }

    const pincodeValue = String(pincode).trim();
    const pincodeDigits = pincodeValue.replace(/[^0-9]/g, '');
    if (pincodeDigits.length < 4) {
      return res.status(400).json({ message: 'Invalid pincode provided.' });
    }

    if (!ACCESS_ROLE_OPTIONS.includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected.' });
    }

    const payload = {
      name: name.trim(),
      contact: isEmail ? contactValue.toLowerCase() : contactValue,
      pincode: pincodeDigits,
      country: country.trim(),
      role,
      isContributor: Boolean(isContributor),
      secretCode: secretCode.trim(),
      meta: {
        ip: req.ip,
        userAgent: req.get('user-agent') || '',
        contactType: isEmail ? 'email' : 'phone',
      },
    };

    const entry = await AccessRequest.create(payload);
    return res.status(201).json({ success: true, id: entry._id });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to save access request.' });
  }
};
