# Privacy Policy — UdharKitab

**Last updated:** [DATE]
**Effective date:** [DATE]

This Privacy Policy explains how UdharKitab ("**UdharKitab**", "**the App**", "**we**", "**us**", "**our**") collects, uses, stores, shares, and protects information when you use our mobile application (available on Android and iOS, package/bundle ID `com.udharkitab.app`).

UdharKitab is built for shopkeepers and small business owners in India to maintain a digital **udhar/khata (credit) book** — recording who owes them money, how much, and when it's due. UdharKitab is a product powered by **Vybex**.

This policy is written to comply with the **Digital Personal Data Protection Act, 2023** and the **Digital Personal Data Protection Rules, 2025** (together, "**DPDP Law**"), the **Information Technology Act, 2000** and the Information Technology (Reasonable Security Practices and Sensitive Personal Data or Information) Rules, 2011, and the data disclosure requirements of the Google Play Store and Apple App Store.

By using UdharKitab, you agree to the collection and use of information as described here. If you do not agree, please do not use the App.

---

## 1. Who this policy covers — two categories of people

Because of how the App works, this policy needs to speak to **two different kinds of people**, and it's important you understand which one you are:

1. **You, the App user (the "Account Holder")** — the shopkeeper or business owner who downloads UdharKitab, creates an account, and enters data into it. Most of this policy is written for you.
2. **Your Customers (the "Data Subjects")** — the people _you_ record in your ledger (their name, phone number, and amounts owed). They do not download or interact with the App themselves. Section 9 below explains your responsibilities toward them.

---

## 2. Information We Collect

### 2.1 Information you provide directly

| Data                                                                                     | When it's collected                       | Why                                                    |
| ---------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------ |
| Name, email address, profile photo                                                       | When you sign in with Google              | To create and secure your account                      |
| Shop name, display theme, language preference                                            | During onboarding / Settings              | To personalize the App                                 |
| Customer name and phone number                                                           | When you add a customer to your ledger    | Core function of the App — tracking who owes you money |
| Transaction entries (amount, note, date, due date), payments, and running credit/balance | When you record udhar entries or payments | Core ledger function                                   |

### 2.2 Information collected automatically

- **Firebase Authentication identifiers** (your unique user ID) — used to link your data to your account and, if enabled, to your cloud backup.
- **Basic app/device information** processed incidentally by our infrastructure providers (Google Firebase, RevenueCat) to operate their services, such as device type, OS version, and IP address at the time of a request. We do not run any advertising SDK or behavioral analytics/tracking SDK in the App.
- **Subscription and purchase information** via RevenueCat when you buy a premium subscription — such as your purchase/entitlement status, transaction ID, and renewal date. **We do not receive or store your card, UPI, or bank details** — payments are processed entirely by Google Play / Apple's payment systems and passed to RevenueCat as tokens/receipts.

### 2.3 Information we do **not** collect

We do not access your camera, precise/coarse location, microphone, or your phone's Contacts list. The App's "Call" button and "Send WhatsApp reminder" button simply open your phone's own Dialer or WhatsApp app with a number/message pre-filled — **we do not see, log, or transmit the call or the WhatsApp message**; you send it yourself from within those apps.

---

## 3. How Your Data Is Stored

- **On-device (primary storage):** All your shop, customer, and ledger data is stored locally on your device in a private SQLite database. This is the source of truth — the App works fully offline.
- **Cloud backup (optional, opt-in):** During onboarding (or later from Settings), you may choose to enable **Cloud Sync**. If enabled, your customer and ledger data is copied to **Google Firebase Cloud Firestore**, in a private data store accessible only to your signed-in account (`users/{your-user-id}/customers/...`). You can switch this off at any time, and your data continues to work fully offline.
- If you never enable Cloud Sync, your ledger data never leaves your device (except as part of a phone backup you configure yourself through Android/iOS).

---

## 4. How We Use Your Information

We use the information described above only to:

1. Create, authenticate, and secure your account;
2. Provide the core ledger/khata functionality (recording, calculating, and displaying dues, payments, and balances);
3. Sync and back up your data across your own devices, if you opt in;
4. Process and validate your subscription/trial status;
5. Respond to support requests and fix bugs;
6. Comply with legal obligations, prevent fraud, and enforce our Terms of Service.

We do **not** sell your data, and we do **not** use your customers' names, phone numbers, or financial data for advertising, profiling, or any purpose beyond providing the App's ledger function to you.

---

## 5. Who We Share Data With

We share data only with the following service providers, strictly to operate the App (each acts as our data processor, bound by their own security and confidentiality obligations):

| Provider                                              | Purpose                              | Data involved                                                         |
| ----------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------- |
| **Google Firebase** (Authentication, Cloud Firestore) | Sign-in and optional cloud backup    | Name, email, UID, customer/ledger data (if Cloud Sync is on)          |
| **Google Sign-In**                                    | Authentication                       | Name, email, profile photo                                            |
| **RevenueCat**                                        | Subscription/entitlement management  | User ID, purchase/transaction and entitlement data                    |
| **Google Play / Apple App Store**                     | Payment processing, app distribution | Purchase data (card details are handled by Google/Apple, never by us) |

We do not share data with data brokers, advertisers, or analytics companies. We will only disclose personal data to law enforcement or government authorities if legally compelled to do so (e.g., a valid court order or statutory request under Indian law).

### Cross-border data transfer

Some of the above providers (Google Firebase, RevenueCat) may process or store data on servers located outside India. Under the DPDP Act, 2023, cross-border transfer of personal data is permitted except to countries specifically restricted by the Central Government; as of the date of this policy, we are not aware of any such restriction applicable to our providers. We require these providers to maintain security standards consistent with applicable law.

---

## 6. Data Retention

- Your ledger data is retained on your device and (if Cloud Sync is on) in our cloud store for as long as you keep your account active.
- If you **delete a customer** from your ledger, that customer's records are removed from your local database and, on next sync, from the cloud.
- If you **delete your account** (Settings → Account → Delete Account), we permanently delete: your local on-device data, your Firestore cloud documents, and your Firebase Authentication record. This action is irreversible and takes effect immediately, with no residual copies retained in any routine backups thereafter.

---

## 7. Your Rights

As a Data Principal under the DPDP Act, 2023, you have the right to:

- **Access** a summary of the personal data we hold about you and the processing activities;
- **Correct or update** inaccurate or incomplete data (directly in-app, for most fields);
- **Erase** your personal data (via in-app account deletion, or by writing to us);
- **Withdraw consent** at any time (e.g., by turning off Cloud Sync, or deleting your account) — this does not affect the lawfulness of processing before withdrawal;
- **Nominate** another individual to exercise your rights in the event of death or incapacity;
- **Grievance redressal** — raise a complaint with us (see Section 11), and if unresolved, with the Data Protection Board of India.

To exercise any of these rights, contact us using the details in Section 11.

---

## 8. Children's Privacy

UdharKitab is a business tool intended for adults (18+) running or working in a shop or small business. We do not knowingly collect personal data from children. If we learn that we have inadvertently collected a child's personal data, we will delete it promptly. If you believe a child has provided us data, please contact us using the details below.

---

## 9. Your Responsibilities Regarding Your Customers' Data (Important)

Because UdharKitab lets you record **other people's** names, phone numbers, and financial information (how much they owe you), you — the Account Holder — act as the party responsible for that data in your relationship with your customers, and UdharKitab acts only as the tool/processor that stores and displays it on your instructions. This means:

- You are responsible for ensuring you have a lawful basis (such as your existing business/credit relationship) to record your customer's name, phone number, and dues in the App;
- You should not use the App to record sensitive personal information about a customer beyond what is necessary for your credit ledger (i.e., avoid adding notes containing health, financial account, or other sensitive details);
- If a customer asks you to correct or delete their information from your records, you are responsible for making that change in the App;
- UdharKitab will assist by providing the in-app tools to edit or delete customer records, and by ensuring data you delete is actually removed from our systems, but we do not have an independent relationship with your customers and cannot act on their requests directly unless you are unreachable and the request is validated through appropriate legal process.

---

## 10. Security

We use reasonable technical and organizational safeguards to protect your data, including encrypted transmission (HTTPS/TLS) to our cloud providers, Google Firebase's access-controlled, per-user data isolation (Firestore security rules restrict each account to only its own data), and secure on-device storage. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security, but we do not knowingly leave customer or ledger data exposed to other users or the public.

---

## 11. Grievance Officer / Contact Us

In accordance with the Information Technology Act, 2000 and the DPDP Act, 2023, you may contact our Grievance Officer for any questions, complaints, or requests relating to this policy or your data:

**Grievance Officer:** Harsh Yadav
**Entity:** Harsh Yadav, trading as Vybex (an individual project/brand, not a separately registered company, LLP, or proprietorship as of the date of this policy)
**Address:** 213, Prince City, MR-10, Indore, Madhya Pradesh, India
**Email:** yadav.harsh2798@gmail.com
**Response time:** We aim to acknowledge requests within 48 hours and resolve them within 30 days.

If you are not satisfied with our response, you may escalate your complaint to the **Data Protection Board of India** (once operational for complaints of this nature) or approach the appropriate consumer or IT grievance forum under Indian law.

---

## 12. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in the App, our practices, or the law. We will notify you of material changes through the App or by updating the "Last updated" date above. Continued use of the App after changes take effect constitutes acceptance of the revised policy.

---

## 13. Governing Law

This policy is governed by the laws of India. Any disputes arising out of or in connection with this policy shall be subject to the exclusive jurisdiction of the courts at Indore, Madhya Pradesh, India.

---

_This policy is also available in-app and at: https://github.com/vybex-dev/udharkitab/blob/main/Privacy.md_
