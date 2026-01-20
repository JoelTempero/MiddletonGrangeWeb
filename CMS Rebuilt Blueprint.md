# Middleton Grange School Website - Complete CMS Rebuild Blueprint

**Site URL:** https://www.middleton.school.nz/  
**Platform:** WordPress with Elementor (current)  
**Developer:** AllTeams (https://www.allteams.co.nz/)

---

## 1. Complete Navigation Structure

### Main Menu (8 Top-Level Sections)

**1. About MGS**
- Principal's Welcome → `/principals-welcome/`
- Special Character → `/special-character/`
- Vision & Mission Statement → `/vision-mission-statement/`
- Motto, Crest, Verse, Hymn, Prayer, Haka → `/motto-crest-verse-hymn-prayer-haka/`
- Annual Theme → `/annual-theme/`
- Our History → `/history/`
- Senior Leadership Team → `/main-school-leaders/`
- Board → `/board/`
- Affiliations → `/affiliations/`
- Key Publications → `/key-publications/`
- Venue Hire → `/venue-hire/`
- Location & Site Map → `/location-site-map/`
- Contact Us → `/contact-us/`
- The Grange Theatre → `https://thegrangetheatre.nz/` (external)

**2. Life at MGS**
- Four Schools in One → `/four-schools-in-one/`
- Primary School (Years 1-6) → `/primary-school-years-1-6/`
- Middle School (Years 7-10) → `/middle-school-years-7-10/`
- Senior College (Years 11-13) → `/senior-college-years-11-13/`
- International College (Years 1-13) → `/international/`
- Parenting Support → `/parenting-support/`
- Be Involved → `/be-involved/`
- Uniform → `/uniform-code/`
- Stationery → `/stationery/`
- Canteen → `/canteen/`
- House Competition → `/house-system/`
- Video Gallery → `/video-gallery/`
- Employment → `/employment/`

**3. Enrolment**
- Enrolment Information → `/enrolment-information/`
- Enrolment Scheme → `/enrolment-scheme/`
- Privacy → `/privacy/`
- Fees & Other Costs → `/fees-other-costs/`
- FAQ's → `/choosing-the-right-school/`
- Starting School → `/starting-school/`

**4. Learning**
- Curriculum & Subjects → `/curriculum-subjects/`
- Course Selection → `/course-selection/`
- Careers Department → `/careers-department/`
- Leadership → `/leadership/`
- Service → `/service/`
- Remote Learning → `/remote-learning/`
- NCEA Information → `/ncea-information/`
- Learning Support → `/learning-support/`
- Fostering Strengths → `/fostering-strengths/`
- Pastoral Care → `/pastoral-care/`
- BYOD → `/byod/`
- Library Dashboard → `https://aiscloud.nz/MDD00/#!landingPage` (external)
- Overseas Trips → `/overseas-trips/`
- Sport → `/sport/`
- Sports Offered → `/sports-offered/`
- Performing Arts → `/performing-arts/`
  - Middleton Music Academy → `/musicacademy/`
  - Music Tuition → `/music-tuition/`
  - Instrument Hire → `/instrument-hire/`
  - Music Performance Groups → `/music-performance-groups/`
  - School Production → `/school-production/`
  - Middleton Dance Academy → `/danceacademy/`
  - Drama → `/drama/`
  - Kapa Haka → `/kapa-haka/`
  - Pasifika → `/pasifika/`
  - Tech Crew → `/tech/`
  - The Fridge Radio → `/the-fridge-radio/`

**5. Kahika Centre**
- Te Ohu Kahika (main) → `/te-ohu-kahika/`
- Vision → `/te-ohu-kahika-vision/`
- Lab Days → `/te-ohu-kahika-labs/`
- Sponsorship → `/te-ohu-kahika-sponsorship/`
- Current Workshops → `/te-ohu-kahika-workshops/`

**6. News & Events**
- School Hours & Term Dates → `/school-hours-term-dates/`
- Calendar → `/calendar/`
- Latest News → `/latest-news/`
- Newsletters → `/newsletters/`
- Galleries → `/galleries/`
- Fundraisers → `/fundraisers/`

**7. Alumni**
- Alumni Welcome → `/alumni/`
- 60th Anniversary → `/60th-anniversary/`
- Alumni Profiles → `/alumni-profiles/`
- New Alumni → `/new-alumni/`
- Update Your Details → `/alumni-update-details/`
- Alumni Newsletters → `/alumni-newsletters/`
- Donations → `/donations/`

**8. International**
- Welcome → `/international/`
- International Contact → `/international-contact/`
- International Enrolment → `/international-enrolment/`
- Residential Care Accommodation → `/homestays/`
- NCEA & Subjects → `/ncea/`
- ESOL Programmes → `/esol-programmes/`
- University Pathways → `/university-pathways/`
- Student Stories → `/student-stories/`
- Our Photos → `/international-photos/`
- Our Videos → `/international-videos/`
- Useful Links → `/useful-links/`
- International Board → `/international-board/`
- International College Staff → `/international-college-staff/`
- ERO Review → `https://ero.govt.nz/institution/335/middleton-grange-school` (external)
- Agents → `/agents/`

### Quick Links Panel (Slide-out)
- Parent Portal → `https://middleton.school.kiwi/`
- Student Portal → `https://middletonschoolnz.sharepoint.com/teams/home`
- Calendar → `/calendar/`
- KINDO → `https://shop.tgcl.co.nz/shop/q2.shtml?session=false&shop=Middleton%20Grange%20School`
- School App → `http://middletongrange.apps.school.nz/share/`
- Facebook → `https://www.facebook.com/Middletongrangeschool/`
- Contact Us → `/contact-us/`
- Search box

---

## 2. Design System

### Brand Colors
- **Primary Blue:** Deep royal blue (Middleton Blue)
- **Accent Gold/Yellow:** Used for highlights
- **White:** Backgrounds, text contrast
- **Light Gray:** Section backgrounds, dividers
- **Dark Navy:** Text elements

### Typography
- **Headings:** Sans-serif (custom/premium)
- **Body Text:** Sans-serif for readability

### Logo Assets
| Asset | URL |
|-------|-----|
| Main Logo (768x211) | `https://www.middleton.school.nz/wp-content/uploads/2019/11/cropped-Middleton-Grange-Logo_1300px-768x211.png` |
| School Crest | `https://www.middleton.school.nz/wp-content/uploads/2021/05/Middleton-crest-logo.jpg` |
| The Fridge Radio Logo | `https://www.middleton.school.nz/wp-content/uploads/elementor/thumbs/the-fridge-logo-trans2-qblhsja5na8xyicxfllqovzbfedxo87ytwpb6vhgty.png` |
| Music Academy Logo | `https://www.middleton.school.nz/wp-content/uploads/2019/11/MMA-Logo-w-side3.png` |
| 60th Anniversary Logo | `https://www.middleton.school.nz/wp-content/uploads/2025/06/23169-60th-merch-logo-FA-01-300x298.png` |

### Header Design
- Fixed header with logo (top left)
- Horizontal mega-menu navigation
- "QUICK LINKS" button (top right) triggers slide-out panel
- Skip-to-content accessibility link

### Footer Design
**4-Column Layout:**
1. **Social & Apps:** Facebook link, School App download, The Fridge Radio logo
2. **Contact Details:** Address, phone, email, International College contact
3. **Search:** Search box
4. **Map:** "MAP TO SCHOOL" with embedded map widget

**Footer Bottom:**
- Copyright: "© Middleton Grange School. All rights reserved."
- Credit: "School Website Design by AllTeams"

### Daily Verse Widget
- **Integration:** DailyVerses.net WordPress Plugin
- Auto-updates daily with Bible verse and reference
- Link format: `https://dailyverses.net/[YYYY]/[MM]/[DD]`

---

## 3. Homepage Deep Dive

### Hero Section
- **Video Background URL:** `https://www.middleton.school.nz/wp-content/uploads/2020/03/See-Us-In-Action.mp4`
- **Overlay Text:**
  - H1: "Welcome to Middleton Grange School"
  - H3: "Middleton Grange School is known for its high quality education and as a compassionate community in which the God-given gifts and talents of students are nurtured and celebrated."
- **Feature:** "Play video with sound" popup trigger (Popup ID: 6452)

### Back to School Information Section
**Heading:** "2026 Back to School Information"

| Year Group | PDF URL |
|------------|---------|
| Years 1-6 | `https://www.middleton.school.nz/wp-content/uploads/2025/12/2026-Years-1-6-Back-to-School-Information_.pdf` |
| Years 7-10 | `https://www.middleton.school.nz/wp-content/uploads/2025/12/2026-Years-7-10-Back-to-School-Information.pdf` |
| Years 11-13 | `https://www.middleton.school.nz/wp-content/uploads/2025/12/2026-Years-11-13-Back-to-School-Information.pdf` |
| International College | `https://www.middleton.school.nz/wp-content/uploads/2025/12/2026-International-College-Back-to-School-Information-.pdf` |

### Open Day Video Sections
| School Division | Video URL |
|-----------------|-----------|
| Primary School | `https://www.middleton.school.nz/wp-content/uploads/siteassets/primary-school.mp4` |
| Middle School | `https://www.middleton.school.nz/wp-content/uploads/siteassets/middle-school-2.mp4` |
| Senior College | `https://www.middleton.school.nz/wp-content/uploads/siteassets/senior-college-2.mp4` |

### Character/Excellence/Service/Glory Section
**4-Column Grid Layout:**

1. **CHARACTER**
   - Description: "To bring glory to God by becoming more and more like Jesus."
   - Scripture: 2 Peter 1:5b-8 (NLT)

2. **EXCELLENCE**
   - Description: "To bring glory to God by making the very best use of the talents and abilities he has given us."
   - Scripture: Colossians 3:23 (NIV)

3. **SERVICE**
   - Description: "To bring glory to God by giving of ourselves to benefit others."
   - Scripture: Philippians 2:3-7 (NIV)

4. **FOR THE GLORY OF GOD**
   - Description: "Our desire is to honour and please God in every aspect of our lives..."
   - Scripture: 1 Corinthians 10:31 (NIV)

---

## 4. Special Page Types & Templates

### Staff/Leadership Profile Template
**Layout:** Grid of photo cards
- Photo (thumbnail)
- Name (H3)
- Title/Role (H3)
- No bios on listing page

**Example Staff:**
- Mr Gregg Le Roux - Principal
- Mr Craig Utting - Associate Principal
- Mrs Christine Buckley - Deputy Principal Primary School
- Mrs Louise Arndt - Acting Deputy Principal Middle School
- Mr Shane McConnell - Deputy Principal Senior College
- Mrs Jenny Addison - Deputy Principal Staffing & Waiora
- Mr Dean McKenzie - Deputy Principal School Management
- Mrs Colleen Steyn - Director International College

### Alumni Profile Template
**Listing Page:** Grid with filterable cards
- **Filters:** Individual years (1969-2023) AND Decade ranges (1970-79 through 2020-29)
- Cards show: Photo thumbnail, Name (linked), Graduation year tag

**Individual Profile:**
- Header: "Alumni Profile"
- Large portrait photo
- Leaving year tag
- Free-form biographical content
- "Back to Alumni" navigation
- "More Alumni Profiles" related sidebar (6 thumbnails)

### News/Blog Template
**Listing:** Single-column article layout
- Short announcement-style posts
- Links to external documents (SharePoint PDFs)
- No visible categories/tags or pagination
- Newsletter CTA: "To read our latest newsletter, CLICK HERE" → `https://newsletter.middleton.school.nz/`

### Video Gallery Template
**Display:** Grid layout with YouTube embeds
- Videos organized chronologically by year
- Producer credit text below each embed
- **Example 2024 Videos:** 12 YouTube embeds from "Technicolour Thoughts"

### Photo Gallery Template
**Plugin:** Envira Gallery
- Album-based organization
- Lightbox functionality
- Grid display

### Calendar/Events Template
**Integration:** KAMAR School Management System
- Events pulled from KAMAR
- Category: "Kamar" applied to all events
- **ICS Feeds:**
  - Events: `https://web.kamar.middleton.school.nz/index.php/ics/school.ics`
  - Days: `https://web.kamar.middleton.school.nz/index.php/ics/days.ics`
- List format display, 10 events per page
- Monthly archives dating to August 2015

### Sports Offered Template
**Display:** Grid of clickable tiles for each sport
- 17 sports categories with individual pages
- Each sport page includes: Year levels, Terms, Cost, Requirements, External links

---

## 5. Forms Documentation

### Contact Form (Contact Us Page)
- Staff name links open online contact forms
- Email format: `initial.surname@middleton.school.nz`

### New Alumni Registration Form
| Field | Type | Required |
|-------|------|----------|
| First Name | Text | Yes |
| Last Name | Text | Yes |
| Maiden Name | Text | No |
| Email | Email | Yes |
| Mobile Phone | Tel | No |
| Are you a past: (Student/Staff/Board/Other) | Radio | Yes |
| Relationship with school (if "Other") | Text | Conditional |
| Year finished at MGS | Text | No |
| Achievements/Awards | Textarea | No |
| Street Address | Text | No |
| Address Line 2 | Text | No |
| City | Text | No |
| ZIP/Postal Code | Text | No |
| Country | Dropdown | No |

### Alumni Update Details Form
Same structure as New Alumni, minus the "Are you a past" question.

### Performing Arts Sign-up
- **URL:** `https://forms.office.com/r/arRTyQYz9v`

### Sports Apparel Order
- **URL:** `https://forms.office.com/r/47hrLPdrHM`

### Music Lessons Registration
- **URL:** `https://forms.office.com/pages/responsepage.aspx?id=9SuBcUmkjEKokiT3wjTxBUuJLqDIJApFjBeg0M12_n9UNEFNSTJYVEhGTlVTSVFWT1I2RDY2UzRDNS4u&route=shorturl`

---

## 6. External Integrations

### Portal Systems
| System | URL | Platform |
|--------|-----|----------|
| Parent Portal | `https://middleton.school.kiwi/` | KAMAR |
| Student Portal | `https://middletonschoolnz.sharepoint.com/teams/home` | Microsoft SharePoint |
| KINDO Shop | `https://shop.tgcl.co.nz/shop/q2.shtml?session=false&shop=Middleton%20Grange%20School` | TGCL |
| School App | `http://middletongrange.apps.school.nz/share/` | Custom |
| Library Dashboard | `https://aiscloud.nz/MDD00/#!landingPage` | AIS Cloud |
| Careers Website | `https://middleton.careerwise.school/` | CareerWise |
| Newsletter Platform | `https://newsletter.middleton.school.nz/` | Custom subdomain |

### Payment Integrations
- **KINDO:** Uniforms, lunches, stationery orders
- **Convera:** International student fee payments (`https://students.convera.com/middletongrangeschool#!/`)
- **myschool.co.nz/mgs:** Stationery ordering

### Social Media
| Platform | URL |
|----------|-----|
| Facebook | `https://www.facebook.com/Middletongrangeschool/` |
| International Facebook | `https://www.facebook.com/middletoninternational` |
| Instagram (Alumni) | `https://www.instagram.com/mgsalumni/` |
| Instagram (Sports) | `@middletongrangesport` |

### BYOD Portal
- **Provider:** Cyclone Computers
- **URL:** `www.cyclone.co.nz/byod`
- **School Selection:** Middleton Grange School
- **Password:** byodmgs

---

## 7. Contact Information

### Main School
- **Address:** 30 Acacia Ave, Upper Riccarton, Christchurch 8041, New Zealand
- **Main Phone:** +64 (03) 348 9826
- **Primary Phone:** +64 (03) 341 4053
- **Fax:** 03-3488317
- **Email:** office@middleton.school.nz
- **Absences Email:** absences@middleton.school.nz
- **Office Hours:** 8:15am - 4:30pm (Term Time)

### International College
- **Phone:** +64 3 341 4054
- **Email:** inted@middleton.school.nz
- **Urgent:** +64 21 806 846
- **After-Hours Emergency:** +64 21 088 39594
- **Absence Text:** 021 293 7436

### The Fridge Radio
- **FM Frequency:** 88.3FM (Christchurch)
- **Phone:** 0800 THE FRIDGE
- **Email:** thefridge@middleton.school.nz
- **Website:** thefridge.net.nz

### The Grange Theatre
- **Address:** 27 Arthur Street, Upper Riccarton, Christchurch 8041
- **Website:** thegrangetheatre.nz
- **Capacity:** 304 seats
- **Venue Hire Contact:** Mrs Rhian Horn

### Key Staff Emails
| Role | Email |
|------|-------|
| Sports | sport@middleton.school.nz |
| Performing Arts | PAC@middleton.school.nz |
| Careers | n.bailey@middleton.school.nz |
| Careers/Gateway | careers.gateway@middleton.school.nz |
| ESOL Coordinator | g.anderson@middleton.school.nz |
| Kahika Centre | k.malcolm@middleton.school.nz |
| Drama | m.mccormack@middleton.school.nz |
| Kapa Haka | p.moon@middleton.school.nz |
| Enrolments | enrolments@middleton.school.nz |

---

## 8. Key PDF Documents

### Course Information (2026)
| Year | URL |
|------|-----|
| Year 9 | `https://www.middleton.school.nz/wp-content/uploads/2025/08/Year-9-Course-Information-2026.pdf` |
| Year 10 | `https://www.middleton.school.nz/wp-content/uploads/2025/08/Year-10-Course-Information-2026.pdf` |
| Year 11 | `https://www.middleton.school.nz/wp-content/uploads/2025/09/Year-11-Course-Information-2026.pdf` |
| Year 12 | `https://www.middleton.school.nz/wp-content/uploads/2025/09/Year-12-Course-Information-2026.pdf` |
| Year 13 | `https://www.middleton.school.nz/wp-content/uploads/2025/09/Year-13-Course-Information-2026.pdf` |

### Handbooks
| Document | URL |
|----------|-----|
| MS Handbook 2025 | `https://www.middleton.school.nz/wp-content/uploads/2025/03/MS-Handbook-2025.pdf` |
| SC Handbook 2025 | `https://www.middleton.school.nz/wp-content/uploads/2025/01/SC-Handbook-2025.pdf` |
| Primary Parent Info 2023 | `https://www.middleton.school.nz/wp-content/uploads/2023/03/Parent-Information-Booklet-2023.pdf` |
| NCEA Handbook 2024 | `https://www.middleton.school.nz/wp-content/uploads/2024/02/Student-and-Parent-Handbook-NCEA-2024.pdf` |

### Enrolment Zone Maps (2026)
| Zone | URL |
|------|-----|
| Year 1-8 Catchment | `https://www.middleton.school.nz/wp-content/uploads/2025/02/Year-1-8-Catchment-Zone-1-2.pdf` |
| Year 1-8 Eastern Boundary | `https://www.middleton.school.nz/wp-content/uploads/2025/02/Year-1-8-Catchment-Zone-Eastern-Boundary-1.pdf` |
| Year 1-8 Southwest Boundary | `https://www.middleton.school.nz/wp-content/uploads/2025/02/Year-1-8-Catchment-Zone-Southwest-Boundary-1.pdf` |
| Year 9-10 Catchment | `https://www.middleton.school.nz/wp-content/uploads/2025/02/Year-9-10-Catchment-Zone-1-1.pdf` |
| Year 11-13 Catchment | `https://www.middleton.school.nz/wp-content/uploads/2025/02/Y11-13-Catchment-Zone-1-1.pdf` |

### Other Key Documents
| Document | URL |
|----------|-----|
| School Prospectus | `https://www.middleton.school.nz/wp-content/uploads/2018/10/prospectus_middleton-grange_webversion.pdf` |
| Site Map | `https://www.middleton.school.nz/wp-content/uploads/2021/03/SitePlan1.png` |
| Uniform Price List | `https://www.middleton.school.nz/wp-content/uploads/2023/10/Uniform-Shop-Price-List.pdf` |
| Sports Clothing Details | `https://www.middleton.school.nz/wp-content/uploads/2025/06/MGS-Sport-Clothing-Details.pdf` |
| Available Places 2026 | `https://www.middleton.school.nz/wp-content/uploads/2025/04/Click-here-for-Available-Places-Enrolment-2026.pdf` |
| International Fee Schedule 2026 | `https://www.middleton.school.nz/wp-content/uploads/2025/05/Master-fee-schedule-2026-1.pdf` |
| University Pathways Brochure | `https://www.middleton.school.nz/wp-content/uploads/2021/06/Pathway-to-the-Future-Brochure-No-Camp-1.pdf` |

---

## 9. School Information Summary

### School Structure
- **Total Roll:** ~1,400 students
- **Primary School:** Years 1-6, ~300 students
- **Middle School:** Years 7-10, ~450 students
- **Senior College:** Years 11-13, ~550 students
- **International College:** Years 1-13, ~100 students

### Special Character
- State-integrated Christian school (since 1996)
- Non-denominational, interdenominational
- Established February 4, 1964
- Proprietor: The Christian Schools' Trust

### School Identity
- **Motto:** "Character, Excellence, Service for the Glory of God"
- **School Verse:** "In Thy light shall we see light." - Psalm 36:9
- **School Hymn:** "We Rest on Thee" (Sibelius 'Finlandia' tune)
- **Principal:** Mr Gregg Le Roux

### Fees (2026)
| Fee Type | Amount |
|----------|--------|
| Attendance Dues (CST) | $1,800/student/year |
| SCD (1 child) | $540/year |
| SCD (2 children) | $972/year |
| SCD (3 children) | $1,080/year |
| SCD (4+ children) | $1,188/year |
| NCEA Fees (NZQA) | ~$383.30 |

### School Hours
| Division | Mon/Tue/Thu/Fri | Wednesday |
|----------|-----------------|-----------|
| Years 1-6 | 8:45am - 3:00pm | 8:45am - 2:35pm |
| Years 7-13 | 8:45am - 3:00pm | 8:45am - 2:35pm |

### House System
- **Scott** (Antarctic explorer)
- **Shackleton** (Antarctic explorer)
- **Wilson** (Antarctic explorer)
- **Bowen** (Major property owner)

---

## 10. CMS Content Types Required

### Standard Pages
- Basic content pages with sidebar navigation
- Support for: headings, paragraphs, lists, images, videos, PDFs
- Bible verse integration capability

### Staff/Team Profiles
- Photo, name, title fields
- Optional bio field
- Grid display on listing pages

### Alumni Profiles
- Photo, name, graduation year
- Free-form bio content
- Year-based filtering (individual + decade range)
- Related profiles sidebar

### News/Announcements
- Title, content, date
- Optional featured image
- External document links

### Events/Calendar
- KAMAR integration or manual entry
- Date, time, venue fields
- ICS feed export

### Photo Galleries
- Album-based organization
- Lightbox viewing
- Grid display

### Video Galleries
- YouTube embed support
- Producer/credit field
- Year-based organization

### Forms
- Contact forms with staff routing
- Alumni registration
- Multi-field support (text, email, tel, textarea, radio, dropdown)

### Job Listings
- Position title
- Hours, reports to, relationships
- PDF job description support

### Sponsorship/Partners
- Logo upload
- External URL
- Tier categorization

---

## 11. Technical Requirements

### Hosting/Infrastructure
- SSL certificate required
- CDN for media assets recommended
- Email integration for forms

### Third-Party Integrations
- DailyVerses.net API/widget
- YouTube embed API
- KAMAR calendar sync
- Microsoft Forms embed support
- Google Maps embed
- Facebook page feed (optional)

### File Handling
- PDF viewer/download
- MP4 video hosting
- Image optimization
- Upload directory structure: `/wp-content/uploads/[YEAR]/[MONTH]/`

### SEO/Accessibility
- Skip-to-content link
- Alt text support for images
- Meta descriptions
- Structured data for organization

This comprehensive blueprint provides everything needed to rebuild the Middleton Grange School website as a custom CMS-powered site, including all page structures, content, navigation, design elements, integrations, and assets.