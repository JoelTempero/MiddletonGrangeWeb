#!/usr/bin/env node
/**
 * Seed Script - Populate CMS with Middleton Grange School Content
 *
 * Usage: node scripts/seed-content.js
 *
 * Requires: service-account.json in project root
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    path.join(__dirname, '..', 'service-account.json');

try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (error) {
    console.error('Failed to load service account:', error.message);
    console.log('\nPlease ensure service-account.json exists in the project root.');
    console.log('Download it from: Firebase Console → Project Settings → Service Accounts');
    process.exit(1);
}

const db = admin.firestore();

// ============================================
// SITE SETTINGS
// ============================================
const siteSettings = {
    siteName: 'Middleton Grange School',
    siteTagline: 'Christ-centred Education for Life',
    contactEmail: 'office@middleton.school.nz',
    contactPhone: '03 343 3228',
    address: '30 Acacia Avenue, Christchurch 8042, New Zealand',
    socialLinks: {
        facebook: 'https://www.facebook.com/middletongrange',
        instagram: 'https://www.instagram.com/middletongrange'
    },
    footerText: '© Middleton Grange School. All rights reserved.',
    googleAnalyticsId: '',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
};

// ============================================
// MENU SECTIONS
// ============================================
const menuSections = [
    {
        id: 'about',
        title: 'About Us',
        description: 'Learn about our school, mission, and values',
        order: 1,
        visible: true
    },
    {
        id: 'learning',
        title: 'Learning',
        description: 'Our curriculum and educational approach',
        order: 2,
        visible: true
    },
    {
        id: 'enrolment',
        title: 'Enrolment',
        description: 'Join our school community',
        order: 3,
        visible: true
    },
    {
        id: 'community',
        title: 'Community',
        description: 'School life and community connections',
        order: 4,
        visible: true
    },
    {
        id: 'contact',
        title: 'Contact',
        description: 'Get in touch with us',
        order: 5,
        visible: true
    }
];

// ============================================
// PAGES CONTENT
// ============================================
const pages = [
    // ABOUT SECTION
    {
        title: 'Welcome to Middleton Grange',
        slug: 'welcome',
        menuSection: 'about',
        menuOrder: 1,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Welcome | Middleton Grange School',
        metaDescription: 'Welcome to Middleton Grange School - a Christ-centred learning community in Christchurch, New Zealand.',
        content: `
<h2>A Christ-Centred Learning Community</h2>
<p>Middleton Grange School is a Christ-centred, integrated school providing quality education from Year 1 to Year 13. We are committed to partnering with families to nurture students who are equipped to make a positive difference in the world.</p>

<h3>Our Vision</h3>
<p>To be a vibrant learning community where students discover their God-given potential and are inspired to serve others with wisdom, compassion, and integrity.</p>

<h3>Our Mission</h3>
<p>We provide an excellent education within a caring Christian environment, developing the whole person—spiritually, academically, physically, and socially.</p>

<h3>What Makes Us Different</h3>
<ul>
    <li><strong>Christ-centred values</strong> integrated into every aspect of school life</li>
    <li><strong>Strong academic results</strong> with personalised learning pathways</li>
    <li><strong>Holistic development</strong> through sports, arts, and service opportunities</li>
    <li><strong>Supportive community</strong> where every student is known and valued</li>
    <li><strong>Modern facilities</strong> designed for 21st-century learning</li>
</ul>
        `
    },
    {
        title: 'Our History',
        slug: 'history',
        menuSection: 'about',
        menuOrder: 2,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Our History | Middleton Grange School',
        metaDescription: 'Discover the rich history of Middleton Grange School, serving Christchurch families since 1964.',
        content: `
<h2>A Legacy of Christian Education</h2>
<p>Middleton Grange School was established in 1964 by a group of Christian parents who envisioned a school where faith and learning would be seamlessly integrated.</p>

<h3>The Early Years (1964-1980)</h3>
<p>The school began with just 23 students in temporary buildings. Through the dedication of founding families and staff, the school grew steadily, establishing its reputation for academic excellence and Christian character formation.</p>

<h3>Growth and Development (1980-2000)</h3>
<p>The school expanded to include secondary education, becoming a full Year 1-13 school. New facilities were built, including our chapel, gymnasium, and specialist teaching spaces.</p>

<h3>The Modern Era (2000-Present)</h3>
<p>Today, Middleton Grange serves over 1,000 students across our primary and secondary campuses. We continue to innovate in education while remaining true to our founding vision of Christ-centred learning.</p>

<h3>Looking Forward</h3>
<p>As we look to the future, we remain committed to providing an education that prepares students not just for academic success, but for lives of purpose, service, and faith.</p>
        `
    },
    {
        title: 'Our Values',
        slug: 'values',
        menuSection: 'about',
        menuOrder: 3,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Our Values | Middleton Grange School',
        metaDescription: 'The core values that guide everything we do at Middleton Grange School.',
        content: `
<h2>Values That Shape Our Community</h2>
<p>Our values are drawn from our Christian faith and inform every aspect of school life.</p>

<h3>Faith</h3>
<p>We believe that true education acknowledges God as the source of all truth and wisdom. Our faith shapes how we view the world, treat others, and approach learning.</p>

<h3>Excellence</h3>
<p>We strive for excellence in all we do, encouraging students to develop their God-given gifts and talents to their full potential.</p>

<h3>Integrity</h3>
<p>We value honesty, responsibility, and doing the right thing even when no one is watching. We teach students to be people of their word.</p>

<h3>Respect</h3>
<p>We treat all people with dignity and respect, recognising that every person is made in God's image and has inherent worth.</p>

<h3>Service</h3>
<p>We believe we are called to serve others. Students are encouraged to look beyond themselves and contribute positively to their communities.</p>

<h3>Community</h3>
<p>We are stronger together. We foster a sense of belonging where students, staff, and families support and encourage one another.</p>
        `
    },
    {
        title: 'Leadership Team',
        slug: 'leadership',
        menuSection: 'about',
        menuOrder: 4,
        pageType: 'staff-listing',
        status: 'published',
        metaTitle: 'Leadership Team | Middleton Grange School',
        metaDescription: 'Meet the leadership team guiding Middleton Grange School.',
        content: `
<h2>Our Leadership Team</h2>
<p>Our school is led by a dedicated team of experienced educators committed to our vision of Christ-centred education.</p>

<p>The staff listing will display automatically based on staff profiles in the system.</p>
        `
    },

    // LEARNING SECTION
    {
        title: 'Primary School',
        slug: 'primary',
        menuSection: 'learning',
        menuOrder: 1,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Primary School | Middleton Grange School',
        metaDescription: 'Discover our primary school programme for Years 1-6 at Middleton Grange.',
        content: `
<h2>Primary School (Years 1-6)</h2>
<p>Our primary school provides a nurturing environment where young learners develop strong foundations in literacy, numeracy, and Christian character.</p>

<h3>Our Approach</h3>
<p>We use a balanced approach that combines structured learning with discovery and play. Our experienced teachers create engaging learning experiences that cater to different learning styles and abilities.</p>

<h3>Curriculum Highlights</h3>
<ul>
    <li><strong>Literacy</strong> - Strong phonics foundation, reading programmes, and creative writing</li>
    <li><strong>Mathematics</strong> - Hands-on learning, problem-solving, and real-world applications</li>
    <li><strong>Science & Technology</strong> - Inquiry-based learning and STEM activities</li>
    <li><strong>Arts & Music</strong> - Creative expression through visual arts, drama, and music</li>
    <li><strong>Physical Education</strong> - Daily movement, sports skills, and healthy habits</li>
    <li><strong>Christian Studies</strong> - Bible stories, values education, and chapel</li>
</ul>

<h3>Class Sizes</h3>
<p>We maintain small class sizes to ensure every child receives individual attention and support.</p>
        `
    },
    {
        title: 'Middle School',
        slug: 'middle-school',
        menuSection: 'learning',
        menuOrder: 2,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Middle School | Middleton Grange School',
        metaDescription: 'Our middle school programme for Years 7-8 bridges primary and secondary education.',
        content: `
<h2>Middle School (Years 7-8)</h2>
<p>Our middle school provides a supportive transition between primary and secondary education, with increasing independence and subject specialisation.</p>

<h3>The Middle School Difference</h3>
<p>Year 7 and 8 students have their own dedicated area and teaching team. They benefit from specialist subject teachers while still having a home room teacher who knows them well.</p>

<h3>Key Features</h3>
<ul>
    <li>Specialist teaching in core subjects</li>
    <li>Leadership opportunities and responsibilities</li>
    <li>Extended learning options and enrichment</li>
    <li>Outdoor education and camps</li>
    <li>Technology and digital literacy focus</li>
    <li>Pastoral care and wellbeing programmes</li>
</ul>

<h3>Preparing for Secondary</h3>
<p>Our middle school programme intentionally prepares students for the increased demands of secondary school, developing study skills, time management, and self-directed learning.</p>
        `
    },
    {
        title: 'Senior School',
        slug: 'senior-school',
        menuSection: 'learning',
        menuOrder: 3,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Senior School | Middleton Grange School',
        metaDescription: 'Senior school education at Middleton Grange for Years 9-13 with NCEA pathways.',
        content: `
<h2>Senior School (Years 9-13)</h2>
<p>Our senior school offers a comprehensive curriculum leading to NCEA qualifications and preparation for tertiary education and careers.</p>

<h3>NCEA Pathways</h3>
<p>We offer a wide range of NCEA subjects across all levels, with pathways suited to different interests and career goals:</p>
<ul>
    <li>Academic pathways for university entrance</li>
    <li>Vocational pathways with practical skills</li>
    <li>Creative and performing arts options</li>
    <li>Sports academies and development programmes</li>
</ul>

<h3>Subject Options</h3>
<p>Students can choose from a wide range of subjects including:</p>
<ul>
    <li>English, Mathematics, Sciences (Biology, Chemistry, Physics)</li>
    <li>History, Geography, Economics, Accounting</li>
    <li>Languages (Te Reo Māori, Spanish, Japanese)</li>
    <li>Visual Arts, Music, Drama, Media Studies</li>
    <li>Technology, Digital Technology, Design</li>
    <li>Physical Education, Health, Outdoor Education</li>
</ul>

<h3>Academic Results</h3>
<p>Our students consistently achieve above national averages in NCEA, with strong university entrance rates and scholarship results.</p>
        `
    },
    {
        title: 'Sports & Activities',
        slug: 'sports-activities',
        menuSection: 'learning',
        menuOrder: 4,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Sports & Activities | Middleton Grange School',
        metaDescription: 'Explore the wide range of sports and co-curricular activities at Middleton Grange.',
        content: `
<h2>Sports & Co-Curricular Activities</h2>
<p>We believe in developing the whole person. Our extensive sports and activities programme offers something for everyone.</p>

<h3>Sports</h3>
<p>We offer a comprehensive sports programme with opportunities for both participation and competition:</p>
<ul>
    <li><strong>Summer:</strong> Cricket, Tennis, Athletics, Swimming, Touch Rugby</li>
    <li><strong>Winter:</strong> Rugby, Netball, Football, Hockey, Basketball</li>
    <li><strong>Year-round:</strong> Cross Country, Badminton, Table Tennis</li>
</ul>

<h3>Performing Arts</h3>
<ul>
    <li>School productions and musicals</li>
    <li>Concert band, jazz band, and orchestra</li>
    <li>Choir and vocal groups</li>
    <li>Drama and speech competitions</li>
</ul>

<h3>Clubs & Groups</h3>
<ul>
    <li>Robotics and coding clubs</li>
    <li>Debating and public speaking</li>
    <li>Art and photography clubs</li>
    <li>Environmental and service groups</li>
    <li>Chess and board games</li>
</ul>

<h3>Leadership Opportunities</h3>
<p>Students can develop leadership skills through student council, peer support, house captains, and various committee roles.</p>
        `
    },

    // ENROLMENT SECTION
    {
        title: 'Why Choose Us',
        slug: 'why-choose-us',
        menuSection: 'enrolment',
        menuOrder: 1,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Why Choose Middleton Grange School',
        metaDescription: 'Discover why families choose Middleton Grange School for their children\'s education.',
        content: `
<h2>Why Families Choose Middleton Grange</h2>

<h3>Christ-Centred Education</h3>
<p>Our Christian worldview is woven through everything we do, not as an add-on but as the foundation of our approach to education and community.</p>

<h3>Academic Excellence</h3>
<p>Our students consistently achieve strong results in NCEA, with many going on to university and successful careers. We challenge students to reach their potential while providing support when needed.</p>

<h3>Known and Valued</h3>
<p>In our community, every student is known by name. Our pastoral care system ensures no student falls through the cracks, and positive relationships are at the heart of our school.</p>

<h3>Holistic Development</h3>
<p>We develop the whole person—mind, body, and spirit. Through academics, sports, arts, and service, students discover and develop their unique gifts.</p>

<h3>Strong Community</h3>
<p>Middleton Grange is more than a school—it's a community. Parents are actively involved, and families often form lasting friendships through their connection to our school.</p>

<h3>Modern Facilities</h3>
<p>Our campus features modern classrooms, science labs, technology suites, performing arts spaces, sports facilities, and beautiful grounds.</p>
        `
    },
    {
        title: 'How to Enrol',
        slug: 'how-to-enrol',
        menuSection: 'enrolment',
        menuOrder: 2,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'How to Enrol | Middleton Grange School',
        metaDescription: 'Learn about the enrolment process for Middleton Grange School.',
        content: `
<h2>Enrolment Process</h2>
<p>We welcome enquiries from families who share our values and are seeking a Christ-centred education for their children.</p>

<h3>Step 1: Enquire</h3>
<p>Contact our enrolments team or submit an online enquiry. We'll send you an information pack and answer any questions you have.</p>

<h3>Step 2: Visit</h3>
<p>Book a school tour to see our facilities, meet staff, and get a feel for our school culture. We hold regular open days and also offer private tours.</p>

<h3>Step 3: Apply</h3>
<p>Complete the online application form and submit required documents including:</p>
<ul>
    <li>Birth certificate</li>
    <li>Previous school reports</li>
    <li>Immunisation records</li>
    <li>Any relevant learning support documentation</li>
</ul>

<h3>Step 4: Interview</h3>
<p>Families are invited to meet with our Principal or enrolments team to discuss your child's needs and our school's expectations.</p>

<h3>Step 5: Offer</h3>
<p>If your application is successful, you'll receive an enrolment offer. Accept the offer and complete the enrolment by paying the enrolment fee.</p>

<h3>Contact Enrolments</h3>
<p>Email: enrolments@middleton.school.nz<br>
Phone: 03 343 3228</p>
        `
    },
    {
        title: 'Fees & Donations',
        slug: 'fees',
        menuSection: 'enrolment',
        menuOrder: 3,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Fees & Donations | Middleton Grange School',
        metaDescription: 'Information about school fees and donations at Middleton Grange School.',
        content: `
<h2>Fees & Donations</h2>
<p>As an integrated school, we receive government funding for teaching and operational costs, but rely on attendance dues and donations to maintain our special character and facilities.</p>

<h3>Attendance Dues</h3>
<p>Attendance dues contribute to the maintenance and development of our school buildings and grounds, which are owned by the Proprietor rather than the Ministry of Education.</p>

<h3>School Donation</h3>
<p>The school donation supports additional programmes, resources, and activities that enhance your child's education. This donation is voluntary and tax-deductible.</p>

<h3>Activity Fees</h3>
<p>Some activities, camps, and trips have additional costs which are communicated in advance.</p>

<h3>Payment Options</h3>
<ul>
    <li>Annual payment (with discount)</li>
    <li>Term payments</li>
    <li>Fortnightly or monthly automatic payments</li>
</ul>

<h3>Financial Assistance</h3>
<p>We don't want finances to be a barrier to Christian education. Confidential financial assistance may be available for families experiencing hardship. Please contact our office to discuss.</p>

<p><em>For current fee amounts, please contact our office or refer to your enrolment information pack.</em></p>
        `
    },
    {
        title: 'International Students',
        slug: 'international',
        menuSection: 'enrolment',
        menuOrder: 4,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'International Students | Middleton Grange School',
        metaDescription: 'Information for international students wanting to study at Middleton Grange School.',
        content: `
<h2>International Students</h2>
<p>We welcome international students who wish to experience New Zealand education in a supportive Christian environment.</p>

<h3>Why Study With Us</h3>
<ul>
    <li>High-quality New Zealand education</li>
    <li>NCEA qualifications recognised worldwide</li>
    <li>Safe, supportive school community</li>
    <li>Beautiful Christchurch location</li>
    <li>Homestay accommodation with local families</li>
    <li>English language support available</li>
</ul>

<h3>Entry Requirements</h3>
<ul>
    <li>Completed application form</li>
    <li>Academic transcripts from current school</li>
    <li>English proficiency evidence</li>
    <li>Valid student visa</li>
    <li>Medical and travel insurance</li>
</ul>

<h3>Support Services</h3>
<p>Our international team provides comprehensive support including:</p>
<ul>
    <li>Airport pickup and orientation</li>
    <li>Homestay placement and monitoring</li>
    <li>Academic mentoring</li>
    <li>ESOL classes</li>
    <li>Pastoral care and wellbeing support</li>
</ul>

<h3>Contact International Office</h3>
<p>Email: international@middleton.school.nz</p>
        `
    },

    // COMMUNITY SECTION
    {
        title: 'News & Events',
        slug: 'news',
        menuSection: 'community',
        menuOrder: 1,
        pageType: 'news',
        status: 'published',
        metaTitle: 'News & Events | Middleton Grange School',
        metaDescription: 'Stay up to date with the latest news and events from Middleton Grange School.',
        content: `
<h2>School News & Events</h2>
<p>Stay connected with what's happening in our school community.</p>

<p><em>News articles will display here automatically.</em></p>
        `
    },
    {
        title: 'Parent Information',
        slug: 'parents',
        menuSection: 'community',
        menuOrder: 2,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Parent Information | Middleton Grange School',
        metaDescription: 'Important information and resources for Middleton Grange School parents.',
        content: `
<h2>Parent Information</h2>
<p>We believe education is a partnership between school and home. Here you'll find important information for parents.</p>

<h3>Communication</h3>
<ul>
    <li><strong>School App</strong> - Download our app for notices, calendars, and absentee reporting</li>
    <li><strong>Newsletter</strong> - Weekly email newsletter with school news</li>
    <li><strong>Parent Portal</strong> - Access academic reports and information</li>
</ul>

<h3>Key Dates</h3>
<ul>
    <li>Term dates and holidays</li>
    <li>Parent-teacher conferences</li>
    <li>Sports days and events</li>
    <li>School productions</li>
</ul>

<h3>Getting Involved</h3>
<p>There are many ways to be involved in school life:</p>
<ul>
    <li>Parent volunteers in classrooms</li>
    <li>Sports team coaching and managing</li>
    <li>PTA events and fundraising</li>
    <li>Working bees and grounds maintenance</li>
</ul>

<h3>Uniform Shop</h3>
<p>Our uniform shop is open during term time. Second-hand uniforms are also available.</p>

<h3>Before & After School Care</h3>
<p>We offer supervised care before school (from 7:30am) and after school (until 5:30pm) for primary students.</p>
        `
    },
    {
        title: 'Chapel & Faith',
        slug: 'chapel',
        menuSection: 'community',
        menuOrder: 3,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Chapel & Faith | Middleton Grange School',
        metaDescription: 'Learn about the faith life and chapel programmes at Middleton Grange School.',
        content: `
<h2>Chapel & Faith Life</h2>
<p>Our Christian faith is central to who we are. Chapel and faith activities are woven throughout school life.</p>

<h3>Chapel Services</h3>
<p>Students gather weekly for chapel services featuring worship, teaching, and prayer. These services are led by staff, students, and visiting speakers.</p>

<h3>Christian Studies</h3>
<p>All students participate in Christian Studies classes where they learn about the Bible, explore questions of faith, and consider how Christian faith applies to life.</p>

<h3>Prayer & Pastoral Care</h3>
<p>Prayer is a natural part of our school day. Our chaplain and pastoral team are available to support students and families through life's challenges.</p>

<h3>Service Opportunities</h3>
<p>We encourage students to put faith into action through service projects, mission trips, and community outreach.</p>

<h3>Our Chaplain</h3>
<p>Our school chaplain is available to meet with students, lead small groups, and support families. The chaplain works alongside our pastoral care team to nurture students' spiritual growth.</p>
        `
    },

    // CONTACT SECTION
    {
        title: 'Contact Us',
        slug: 'contact',
        menuSection: 'contact',
        menuOrder: 1,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Contact Us | Middleton Grange School',
        metaDescription: 'Contact Middleton Grange School - phone, email, and address information.',
        content: `
<h2>Contact Us</h2>

<h3>Main Office</h3>
<p><strong>Address:</strong> 30 Acacia Avenue, Christchurch 8042, New Zealand</p>
<p><strong>Phone:</strong> 03 343 3228</p>
<p><strong>Email:</strong> office@middleton.school.nz</p>
<p><strong>Office Hours:</strong> Monday to Friday, 8:00am - 4:30pm</p>

<h3>Specific Enquiries</h3>
<ul>
    <li><strong>Enrolments:</strong> enrolments@middleton.school.nz</li>
    <li><strong>Accounts:</strong> accounts@middleton.school.nz</li>
    <li><strong>Absentees:</strong> Report via school app or phone 03 343 3228</li>
</ul>

<h3>Senior Leadership</h3>
<ul>
    <li><strong>Principal:</strong> principal@middleton.school.nz</li>
    <li><strong>Deputy Principal:</strong> deputy@middleton.school.nz</li>
</ul>

<h3>Find Us</h3>
<p>We are located in the Middleton area of Christchurch, easily accessible from Riccarton Road and Blenheim Road.</p>

<p><strong>Parking:</strong> Visitor parking is available at the main entrance off Acacia Avenue.</p>
        `
    },
    {
        title: 'Visit Our School',
        slug: 'visit',
        menuSection: 'contact',
        menuOrder: 2,
        pageType: 'standard',
        status: 'published',
        metaTitle: 'Visit Our School | Middleton Grange School',
        metaDescription: 'Book a tour to visit Middleton Grange School and see our campus.',
        content: `
<h2>Visit Our School</h2>
<p>The best way to get a feel for Middleton Grange is to visit us in person. We'd love to show you around!</p>

<h3>School Tours</h3>
<p>We offer regular school tours during term time. Tours include:</p>
<ul>
    <li>A walk through our campus and facilities</li>
    <li>Opportunity to see classes in action</li>
    <li>Meet with senior staff</li>
    <li>Ask questions about our programmes</li>
</ul>

<h3>Open Days</h3>
<p>We hold Open Days each year where prospective families can explore the school, meet teachers, and learn about our programmes. Check our news section for upcoming dates.</p>

<h3>Book a Tour</h3>
<p>To book a personal tour, please contact our office:</p>
<ul>
    <li>Phone: 03 343 3228</li>
    <li>Email: enrolments@middleton.school.nz</li>
</ul>

<p>We recommend allowing about an hour for your visit.</p>
        `
    }
];

// ============================================
// SEED FUNCTION
// ============================================
async function seedDatabase() {
    console.log('🌱 Starting database seed...\n');

    try {
        // 1. Site Settings
        console.log('📝 Creating site settings...');
        await db.collection('siteSettings').doc('config').set(siteSettings);
        console.log('   ✓ Site settings created\n');

        // 2. Menu Sections
        console.log('📁 Creating menu sections...');
        for (const section of menuSections) {
            await db.collection('menuSections').doc(section.id).set(section);
            console.log(`   ✓ ${section.title}`);
        }
        console.log('');

        // 3. Pages
        console.log('📄 Creating pages...');
        for (const page of pages) {
            const pageData = {
                ...page,
                headerImage: '',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: 'seed-script',
                updatedBy: 'seed-script'
            };
            await db.collection('pages').doc(page.slug).set(pageData);
            console.log(`   ✓ ${page.title}`);
        }
        console.log('');

        // Summary
        console.log('═'.repeat(50));
        console.log('✅ Database seeded successfully!');
        console.log('═'.repeat(50));
        console.log(`\n📊 Summary:`);
        console.log(`   • Site settings: 1`);
        console.log(`   • Menu sections: ${menuSections.length}`);
        console.log(`   • Pages: ${pages.length}`);
        console.log(`\n🚀 You can now view the content in your CMS!`);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

// Run
seedDatabase();
