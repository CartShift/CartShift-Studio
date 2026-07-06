'use client';

import React from 'react';
import {
  Document,
  Image,
  Link,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import type { CVData, CVExperienceItem } from '@/lib/cv/cv-data';
import {
  CV_PROFILE_IMAGE,
  companyLogos,
  resolveCvPdfAsset,
} from '@/lib/cv/cv-media';

interface CVDocumentProps {
  cv: CVData;
}

const accent = '#0f4c75';
const accentSoft = '#3282b8';
const ink = '#0b1220';
const muted = '#475569';
const hairline = '#e2e8f0';
const surface = '#f7f9fc';

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 34,
    paddingTop: 28,
    paddingBottom: 40,
    fontFamily: 'Helvetica',
    fontSize: 8.4,
    color: ink,
    lineHeight: 1.32,
  },
  header: {
    marginBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 8,
    objectFit: 'cover',
    marginRight: 12,
    borderWidth: 0.8,
    borderColor: hairline,
  },
  headerText: {
    flex: 1,
    paddingTop: 2,
  },
  name: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.4,
    color: '#020617',
    lineHeight: 1.15,
    marginBottom: 4,
  },
  headline: {
    fontSize: 10.4,
    color: accent,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.2,
    lineHeight: 1.3,
  },
  rule: {
    height: 1.4,
    backgroundColor: accent,
    marginBottom: 6,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    fontSize: 7.6,
    color: muted,
    lineHeight: 1.4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
  },
  contactLink: {
    flexDirection: 'row',
    alignItems: 'center',
    textDecoration: 'none',
  },
  contactIcon: {
    marginRight: 3,
  },
  contactLabel: {
    color: accent,
  },
  contactSep: {
    marginLeft: 8,
    color: '#cbd5e1',
  },
  link: {
    color: accent,
    textDecoration: 'none',
  },
  section: {
    marginBottom: 10,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  sectionAccent: {
    width: 14,
    height: 2,
    backgroundColor: accent,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 9.4,
    fontFamily: 'Helvetica-Bold',
    color: accent,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  summary: {
    fontSize: 8.7,
    color: '#1e293b',
    textAlign: 'justify',
  },
  role: {
    marginBottom: 9,
    paddingLeft: 9,
    paddingBottom: 3,
    borderLeftWidth: 1.4,
    borderLeftColor: accentSoft,
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  roleLeft: {
    flex: 1,
    paddingRight: 10,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  companyLogo: {
    width: 20,
    height: 20,
    borderRadius: 4,
    objectFit: 'cover',
    marginRight: 7,
    marginTop: 1,
    borderWidth: 0.6,
    borderColor: hairline,
  },
  roleTitleCol: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 9.4,
    fontFamily: 'Helvetica-Bold',
    color: '#020617',
    lineHeight: 1.25,
  },
  company: {
    fontSize: 8.2,
    color: accent,
    fontFamily: 'Helvetica-Bold',
    marginTop: 1.5,
    lineHeight: 1.25,
  },
  roleMeta: {
    width: 118,
    fontSize: 7.3,
    color: muted,
    textAlign: 'right',
    lineHeight: 1.35,
  },
  description: {
    color: muted,
    marginTop: 2,
    marginBottom: 3,
    fontStyle: 'italic',
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 1.6,
  },
  bullet: {
    width: 8,
    color: accent,
    fontFamily: 'Helvetica-Bold',
  },
  bulletText: {
    flex: 1,
    color: '#1e293b',
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -3,
  },
  skillCard: {
    width: '33.333%',
    paddingHorizontal: 3,
    marginBottom: 6,
  },
  skillCardInner: {
    backgroundColor: surface,
    borderLeftWidth: 1.4,
    borderLeftColor: accent,
    padding: 6,
  },
  skillTitle: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: ink,
    marginBottom: 2,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  skillItems: {
    fontSize: 7.2,
    color: muted,
    lineHeight: 1.35,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 18,
  },
  col: {
    flex: 1,
  },
  smallTitle: {
    fontSize: 8.3,
    fontFamily: 'Helvetica-Bold',
    color: ink,
  },
  smallMuted: {
    color: muted,
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 34,
    right: 34,
    borderTopWidth: 0.6,
    borderTopColor: hairline,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#64748b',
    fontSize: 7.2,
  },
});

function LinkedInIcon() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24" style={styles.contactIcon}>
      <Path
        fill={accent}
        d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      />
    </Svg>
  );
}

function GitHubIcon() {
  return (
    <Svg width={9} height={9} viewBox="0 0 24 24" style={styles.contactIcon}>
      <Path
        fill={accent}
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.694.825.576C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </Svg>
  );
}

function Header({ cv }: { cv: CVData }) {
  const contacts: Array<{ key: string; node: React.ReactNode }> = [
    { key: 'loc', node: <Text>{cv.location}</Text> },
    { key: 'auth', node: <Text>{cv.workAuthorization}</Text> },
    {
      key: 'mail',
      node: (
        <Link src={`mailto:${cv.email}`} style={styles.link}>
          {cv.email}
        </Link>
      ),
    },
    {
      key: 'phone',
      node: (
        <Link src={`tel:${cv.phone.replace(/\s+/g, '')}`} style={styles.link}>
          {cv.phone}
        </Link>
      ),
    },
    {
      key: 'li',
      node: (
        <Link src={cv.contact.linkedinUrl} style={styles.contactLink}>
          <LinkedInIcon />
          <Text style={styles.contactLabel}>linkedin.com/in/yotam-faraggi</Text>
        </Link>
      ),
    },
    {
      key: 'gh',
      node: (
        <Link src={cv.contact.githubUrl} style={styles.contactLink}>
          <GitHubIcon />
          <Text style={styles.contactLabel}>github.com/yotamon</Text>
        </Link>
      ),
    },
    {
      key: 'live',
      node: (
        <Link src={cv.contact.portfolioUrl} style={styles.link}>
          Live CV & Portfolio · {cv.contact.portfolioDisplayUrl}
        </Link>
      ),
    },
  ];

  return (
    <View style={styles.header} wrap={false}>
      <View style={styles.headerTop}>
        <Image src={resolveCvPdfAsset(CV_PROFILE_IMAGE)} style={styles.avatar} />
        <View style={styles.headerText}>
          <Text style={styles.name}>{cv.name}</Text>
          <Text style={styles.headline}>{cv.headline}</Text>
        </View>
      </View>
      <View style={styles.rule} />
      <View style={styles.contactRow}>
        {contacts.map((item, idx) => (
          <View key={item.key} style={styles.contactItem}>
            {item.node}
            {idx < contacts.length - 1 ? <Text style={styles.contactSep}>·</Text> : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text>Yotam Faraggi · Senior Product Engineer</Text>
      <Text render={({ pageNumber, totalPages }) => `p. ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function ExperienceRole({ experience }: { experience: CVExperienceItem }) {
  const meta = [experience.duration, experience.location].filter(Boolean).join(' · ');
  const logo = companyLogos[experience.key];

  return (
    <View style={styles.role} wrap={false}>
      <View style={styles.roleHeader}>
        <View style={styles.roleLeft}>
          <View style={styles.roleTitleRow}>
            {logo ? (
              <Image src={resolveCvPdfAsset(logo)} style={styles.companyLogo} />
            ) : null}
            <View style={styles.roleTitleCol}>
              <Text style={styles.roleTitle}>{experience.title}</Text>
              <Text style={styles.company}>{experience.company}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.roleMeta}>{meta}</Text>
      </View>
      {experience.description ? (
        <Text style={styles.description}>{experience.description}</Text>
      ) : null}
      {experience.highlights.map(highlight => (
        <View key={highlight} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{highlight}</Text>
        </View>
      ))}
    </View>
  );
}

export const CVDocument: React.FC<CVDocumentProps> = ({ cv }) => (
  <Document
    title={`${cv.name} - Senior Product Engineer CV`}
    author={cv.name}
    subject={cv.headline}
  >
    <Page size="A4" style={styles.page}>
      <Header cv={cv} />

      <View style={styles.section}>
        <Text style={styles.summary}>{cv.summary.text}</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle>Professional Experience</SectionTitle>
        {cv.experiences.map(experience => (
          <ExperienceRole key={experience.key} experience={experience} />
        ))}
      </View>

      <View style={styles.section} wrap={false}>
        <SectionTitle>Technical Skills</SectionTitle>
        <View style={styles.skillGrid}>
          {cv.skills.map(group => (
            <View key={group.key} style={styles.skillCard}>
              <View style={styles.skillCardInner}>
                <Text style={styles.skillTitle}>{group.category}</Text>
                <Text style={styles.skillItems}>{group.items.join(' · ')}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.twoCol]} wrap={false}>
        <View style={styles.col}>
          <SectionTitle>Education</SectionTitle>
          <Text style={styles.smallTitle}>{cv.education.university}</Text>
          <Text style={styles.smallMuted}>{cv.education.program}</Text>
        </View>
        <View style={styles.col}>
          <SectionTitle>Languages</SectionTitle>
          {cv.languages.map(language => (
            <Text key={language.key} style={styles.smallMuted}>
              <Text style={styles.smallTitle}>{language.name}</Text>
              {`  ${language.level}`}
            </Text>
          ))}
        </View>
      </View>

      <Footer />
    </Page>
  </Document>
);
