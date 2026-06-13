/**
 * BDDN Institute Centralized Course Data Configuration
 * Single source of truth for all course offerings on the website.
 */
const BDDN_COURSES = [
  {
    id: "data-analytics",
    name: "Data Analytics",
    duration: "6 Months",
    summary: "Learn Excel, SQL, Python, Power BI, and Analytics tools used by industry professionals.",
    description: "Learn Excel, SQL, Python, Power BI, and Analytics tools used by industry professionals.",
    category: "Data & AI",
    url: "courses/data-analytics-course.html",
    active: true,
    featured: true,
    tags: ["Python", "SQL", "Power BI", "Tableau", "Excel"]
  },
  {
    id: "digital-marketing",
    name: "Digital Marketing",
    duration: "6 Months",
    summary: "Learn SEO, Google Ads, Meta Ads, Social Media Marketing, and Lead Generation.",
    description: "Learn SEO, Google Ads, Meta Ads, Social Media Marketing, and Lead Generation.",
    category: "Marketing",
    url: "courses/digital-marketing-course.html",
    active: true,
    featured: true,
    tags: ["SEO", "Google Ads", "Meta Ads", "SMM", "GA4"]
  },
  // {
  //   id: "excel-power-bi",
  //   name: "Excel & Power BI",
  //   duration: "3 Months",
  //   summary: "Master Excel Dashboards, Power Query, Data Modeling, and Business Reporting.",
  //   description: "Master Excel Dashboards, Power Query, Data Modeling, and Business Reporting.",
  //   category: "Business Intelligence",
  //   url: "courses/excel-power-bi-course.html",
  //   active: true,
  //   featured: true,
  //   tags: ["MS Excel", "Power BI", "Power Query", "Data Modeling"]
  // }
];

// Make courses data globally accessible
window.BDDN_COURSES = BDDN_COURSES;
