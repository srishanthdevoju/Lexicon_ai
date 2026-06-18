export const mockAnalysisResult = {
  status: "success",
  document_id: "doc-550e8400-e29b-41d4-a716-446655440000",
  data: {
    summary:
      "This is a mutual Non-Disclosure and Restrictive Covenant Agreement between Acme Corporation (Disclosing Party) and TechVenture Startups (Receiving Party). The agreement governs the exchange and protection of confidential business and technical information shared during a potential strategic partnership evaluation. It includes definitions of what constitutes confidential information (covering technical data, source code, algorithms, business strategies, financial records, and customer lists), the permitted purposes for using such information, and the obligations of the Receiving Party to maintain strict confidentiality. The agreement further includes restrictive covenants such as a broad non-compete provision restricting TechVenture Startups from engaging in competing activities for 3 years post-termination, a non-solicitation clause prohibiting recruitment of Acme Corporation's employees for 2 years, and indemnification obligations requiring the Receiving Party to cover all damages arising from any breach. The active term of the NDA is 2 years from the effective date, with certain obligations surviving for 5 years beyond termination. Governing law is set under the jurisdiction of the State of Delaware, United States.",
    clauses: [
      {
        title: "Definition of Confidential Information",
        description:
          "Includes all technical source code, proprietary algorithms, trade secrets, business strategies, customer data, financial projections, marketing plans, and any other information marked as 'Confidential' or reasonably understood to be confidential. Also covers oral disclosures if confirmed in writing within 30 days. This broad definition encompasses virtually all shared information between parties.",
        type: "Standard",
      },
      {
        title: "Permitted Purpose",
        description:
          "The Receiving Party shall use Confidential Information solely for the purpose of evaluating and pursuing the proposed strategic partnership (the 'Permitted Purpose'). Any use beyond this scope requires prior written consent from the Disclosing Party. This includes prohibitions on reverse engineering, decompilation, or any derivative works based on the shared information.",
        type: "Key Term",
      },
      {
        title: "Term and Survival",
        description:
          "The active term of disclosure is 2 years from the Effective Date. Post-termination, confidentiality obligations survive for an additional 5 years. Trade secret protections survive indefinitely, or until such information ceases to qualify as a trade secret under applicable law. This extended survival period exceeds industry norms.",
        type: "Critical",
      },
      {
        title: "Non-Solicitation of Employees",
        description:
          "TechVenture Startups agrees not to recruit, solicit, or hire any employees of Acme Corporation for a period of 2 years following the termination of this agreement. This restriction applies to both direct and indirect solicitation, including through recruitment agencies or affiliated entities.",
        type: "Critical",
      },
      {
        title: "Non-Compete Provision",
        description:
          "TechVenture Startups shall not engage in any business activity that directly or indirectly competes with Acme Corporation's core business lines for a period of 3 years following the termination of this agreement. The geographic scope covers the entire United States and European Union markets.",
        type: "Key Term",
      },
      {
        title: "Return or Destruction of Materials",
        description:
          "Upon written request or termination of this agreement, the Receiving Party must return or securely destroy all Confidential Information, including copies, notes, summaries, and derivatives. A certificate of destruction must be provided within 15 business days. Retained copies for legal compliance purposes must be identified and remain subject to confidentiality obligations.",
        type: "Standard",
      },
      {
        title: "Audit Rights",
        description:
          "Acme Corporation reserves the right to conduct periodic audits of TechVenture Startups' facilities, systems, and records to verify compliance with the terms of this agreement. Audits may be conducted with 48 hours' prior written notice and shall be at the Disclosing Party's expense, unless a material breach is discovered.",
        type: "Key Term",
      },
      {
        title: "Indemnification",
        description:
          "The Receiving Party agrees to indemnify, defend, and hold harmless Acme Corporation against all losses, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from any breach of this agreement. This indemnification is uncapped and includes consequential and indirect damages.",
        type: "Critical",
      },
      {
        title: "Severability",
        description:
          "If any provision of this agreement is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid while preserving the parties' original intent.",
        type: "Standard",
      },
      {
        title: "Governing Law and Jurisdiction",
        description:
          "This agreement is governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes arising under or in connection with this agreement shall be subject to the exclusive jurisdiction of the courts located in Wilmington, Delaware.",
        type: "Standard",
      },
    ],
    risks: [
      {
        severity: "High",
        risk_title: "Overbroad Non-Compete",
        explanation:
          "The non-compete clause restricts TechVenture Startups from engaging in any competing business activity for 3 years across the entire US and EU markets. This scope is exceptionally broad and may be challenged as unreasonable restraint of trade. Courts have historically narrowed such provisions, and enforceability varies significantly by jurisdiction.",
      },
      {
        severity: "High",
        risk_title: "Uncapped Liability",
        explanation:
          "The indemnification clause imposes unlimited liability on the Receiving Party, including consequential and indirect damages. Industry standard practice typically includes liability caps (often set at 1-2x the contract value) and exclusions for indirect damages. This creates significant financial exposure for TechVenture Startups.",
      },
      {
        severity: "High",
        risk_title: "Asymmetric Injunctive Relief",
        explanation:
          "The agreement allows Acme Corporation to seek immediate injunctive relief without the need to post a bond or prove irreparable harm. This one-sided provision gives the Disclosing Party disproportionate enforcement power and may be considered procedurally unconscionable in certain jurisdictions.",
      },
      {
        severity: "Medium",
        risk_title: "Invasive Audit Rights",
        explanation:
          "Acme Corp is granted broad audit rights with only 48 hours' notice, potentially disrupting TechVenture's operations. The scope of auditable materials is not clearly defined, which could lead to overreach. Consider negotiating for annual audit limits and clearer scope definitions.",
      },
      {
        severity: "Medium",
        risk_title: "Indefinite Non-Solicitation",
        explanation:
          "The non-solicitation clause extends for 2 years post-termination but does not clearly define what constitutes 'indirect solicitation.' This ambiguity could be interpreted broadly to restrict normal hiring practices and may conflict with employee mobility rights in certain states like California.",
      },
      {
        severity: "Medium",
        risk_title: "Vague Definition of Oral Disclosures",
        explanation:
          "Oral disclosures are classified as confidential if confirmed in writing within 30 days, but the agreement does not specify consequences for late or missed confirmations. This creates uncertainty about the protection status of verbal communications and could lead to disputes about what was actually disclosed.",
      },
      {
        severity: "Low",
        risk_title: "Unilateral Attorney Fees",
        explanation:
          "In the event of litigation, the agreement requires the Receiving Party to bear all legal costs regardless of outcome. A more balanced approach would be to have the losing party cover costs, which would discourage frivolous claims from either side.",
      },
    ],
  },
};

export const analysisHistory = [
  {
    id: "1",
    name: "NDA_Agreement.pdf",
    date: "Jun 15, 2026",
    status: "analyzed",
    type: "NDA",
  },
  {
    id: "2",
    name: "Vendor_Agreement.pdf",
    date: "Jun 14, 2026",
    status: "analyzed",
    type: "Vendor",
  },
  {
    id: "3",
    name: "Service_Contract.pdf",
    date: "Jun 13, 2026",
    status: "analyzed",
    type: "Service",
  },
  {
    id: "4",
    name: "Employment_Agreement.pdf",
    date: "Jun 12, 2026",
    status: "analyzed",
    type: "Employment",
  },
];

export const chatMessages = [
  {
    id: 1,
    role: "assistant",
    content:
      "Hello! I'm your AI Legal Assistant. I've analyzed the NDA Agreement between Acme Corporation and TechVenture Startups. How can I help you understand this document?",
    timestamp: "10:30 AM",
  },
];

export const mockChatResponses = [
  "Based on my analysis, the non-compete clause in Section 5 is unusually broad — it restricts TechVenture across the entire US and EU for 3 years. This may face enforceability challenges in states like California, which generally prohibit non-competes.",
  "The indemnification clause (Section 8) poses the highest financial risk. It includes uncapped liability with consequential damages. I'd recommend negotiating a liability cap at 1-2x the projected contract value, which is the industry standard.",
  "There are 3 High-severity risks, 3 Medium risks, and 1 Low risk identified. The most critical issues are the overbroad non-compete, uncapped liability, and asymmetric injunctive relief provisions.",
  "The agreement's term is 2 years with a 5-year survival period for confidentiality obligations. Trade secrets are protected indefinitely. This extended survival period exceeds typical NDA norms of 2-3 years.",
  "For the audit rights provision, I recommend negotiating: (1) limiting audits to once per year, (2) requiring 30 days' notice instead of 48 hours, and (3) clearly defining the scope of auditable materials to prevent operational disruption.",
];

export const contractText = `MUTUAL NON-DISCLOSURE AND RESTRICTIVE COVENANT AGREEMENT

This Mutual Non-Disclosure and Restrictive Covenant Agreement ("Agreement") is entered into as of the 1st day of January, 2026 ("Effective Date"),

BETWEEN:

Acme Corporation, a Delaware corporation with its principal offices at 1234 Innovation Drive, Suite 500, Wilmington, DE 19801 ("Disclosing Party")

AND:

TechVenture Startups, Inc., a California corporation with its principal offices at 5678 Silicon Boulevard, San Jose, CA 95110 ("Receiving Party")

(collectively, the "Parties" and individually, a "Party")

RECITALS

WHEREAS, the Parties wish to explore a potential strategic partnership involving the sharing of certain proprietary and confidential information; and

WHEREAS, the Parties recognize the need to protect such information through binding legal obligations;

NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, and for other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the Parties agree as follows:

ARTICLE 1 — DEFINITION OF CONFIDENTIAL INFORMATION

1.1 "Confidential Information" shall mean any and all information, whether written, oral, electronic, or visual, disclosed by one Party to the other, including but not limited to:

(a) Technical data, source code, object code, algorithms, software architectures, system designs, and technical specifications;

(b) Business strategies, marketing plans, financial projections, revenue models, pricing information, and customer lists;

(c) Trade secrets as defined under the Defend Trade Secrets Act of 2016 (18 U.S.C. § 1836 et seq.);

(d) Any information marked as "Confidential," "Proprietary," or with similar designation;

(e) Information that a reasonable person would understand to be confidential based on the nature of the information and circumstances of disclosure.

1.2 Oral disclosures shall be deemed Confidential Information if the Disclosing Party confirms such disclosure in writing within thirty (30) calendar days.

ARTICLE 2 — PERMITTED PURPOSE

2.1 The Receiving Party shall use Confidential Information solely for the purpose of evaluating and pursuing the proposed strategic partnership (the "Permitted Purpose").

2.2 The Receiving Party shall not, without the prior written consent of the Disclosing Party:

(a) Use the Confidential Information for any purpose other than the Permitted Purpose;

(b) Reverse engineer, decompile, or disassemble any Confidential Information;

(c) Create derivative works based on the Confidential Information.

ARTICLE 3 — OBLIGATIONS OF THE RECEIVING PARTY

3.1 The Receiving Party shall protect the Confidential Information using the same degree of care it uses to protect its own confidential information, but in no event less than reasonable care.

3.2 The Receiving Party shall limit access to Confidential Information to those employees, contractors, and advisors who:

(a) Have a bona fide need to know for the Permitted Purpose;

(b) Are bound by written confidentiality obligations no less protective than this Agreement.

ARTICLE 4 — TERM AND SURVIVAL

4.1 This Agreement shall commence on the Effective Date and continue for a period of two (2) years ("Term").

4.2 Confidentiality obligations shall survive the expiration or termination of this Agreement for a period of five (5) years.

4.3 Obligations with respect to trade secrets shall survive indefinitely, or until such information ceases to qualify as a trade secret under applicable law.

ARTICLE 5 — NON-COMPETE PROVISION

5.1 During the Term and for a period of three (3) years following termination, the Receiving Party shall not directly or indirectly engage in any business that competes with the Disclosing Party's core business lines.

5.2 The geographic scope of this restriction shall cover the United States and European Union markets.

ARTICLE 6 — NON-SOLICITATION

6.1 For a period of two (2) years following the termination of this Agreement, the Receiving Party shall not, directly or indirectly, recruit, solicit, or hire any employee of the Disclosing Party.

ARTICLE 7 — AUDIT RIGHTS

7.1 The Disclosing Party shall have the right to conduct audits of the Receiving Party's facilities, systems, and records to verify compliance.

7.2 Audits shall be conducted with forty-eight (48) hours' prior written notice and at the Disclosing Party's expense, unless a material breach is discovered.

ARTICLE 8 — INDEMNIFICATION

8.1 The Receiving Party shall indemnify, defend, and hold harmless the Disclosing Party from and against all losses, damages, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from any breach of this Agreement.

ARTICLE 9 — INJUNCTIVE RELIEF

9.1 The Parties acknowledge that any breach may cause irreparable harm. The Disclosing Party shall be entitled to seek injunctive relief without the need to post a bond or prove irreparable harm.

ARTICLE 10 — RETURN OR DESTRUCTION

10.1 Upon written request or termination, the Receiving Party shall return or destroy all Confidential Information within fifteen (15) business days and provide a certificate of destruction.

ARTICLE 11 — SEVERABILITY

11.1 If any provision is found to be invalid, the remaining provisions shall continue in full force and effect.

ARTICLE 12 — GOVERNING LAW

12.1 This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to conflict of law principles.

12.2 Any disputes shall be subject to the exclusive jurisdiction of the courts in Wilmington, Delaware.

IN WITNESS WHEREOF, the Parties have executed this Agreement as of the Effective Date.

_________________________________
Authorized Signatory, Acme Corporation
Name: Jonathan R. Mitchell
Title: Chief Legal Officer
Date: January 1, 2026

_________________________________
Authorized Signatory, TechVenture Startups, Inc.
Name: Sarah K. Chen
Title: Chief Executive Officer
Date: January 1, 2026`;
