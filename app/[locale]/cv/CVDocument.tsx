'use client';

import React from 'react';
import { Document, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

interface ExperienceItem {
  company: string;
  title: string;
  duration: string;
  durationYears: string;
  location?: string;
  description?: string;
  highlights: string[];
}

interface SkillGroup {
  category: string;
  items: string[];
}

interface LanguageItem {
  name: string;
  level: string;
}

interface CVDocumentProps {
  name: string;
  subtitle: string;
  location: string;
  email: string;
  github: string;
  linkedin: string;
  summary: string;
  experiences: ExperienceItem[];
  skills: SkillGroup[];
  education: {
    university: string;
    program: string;
    years: string;
    description: string;
  };
  languages: LanguageItem[];
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 34,
    paddingTop: 30,
    paddingBottom: 42,
    fontFamily: 'Helvetica',
    fontSize: 9.25,
    color: '#0f172a',
    lineHeight: 1.3,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f766e',
    paddingBottom: 12,
    marginBottom: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#020617',
    lineHeight: 1.15,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 1.25,
    marginBottom: 7,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    color: '#475569',
    fontSize: 8.2,
    lineHeight: 1.25,
  },
  contactLink: {
    color: '#0f766e',
    textDecoration: 'none',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  summary: {
    fontSize: 9.4,
    color: '#1e293b',
  },
  role: {
    marginBottom: 7,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  roleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 3,
  },
  roleTitle: {
    fontSize: 9.9,
    fontWeight: 'bold',
    color: '#020617',
  },
  roleMeta: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'right',
  },
  company: {
    fontSize: 8.8,
    fontWeight: 'bold',
    color: '#0f766e',
    marginBottom: 3,
  },
  description: {
    color: '#475569',
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 2,
  },
  bullet: {
    width: 7,
    color: '#0f766e',
  },
  bulletText: {
    flex: 1,
    color: '#1e293b',
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillCard: {
    width: '31.5%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    padding: 7,
  },
  skillTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#020617',
    marginBottom: 4,
  },
  skillItems: {
    fontSize: 8.1,
    color: '#475569',
  },
  twoCol: {
    flexDirection: 'row',
    gap: 14,
  },
  col: {
    flex: 1,
  },
  smallTitle: {
    fontSize: 9.4,
    fontWeight: 'bold',
    color: '#020617',
    marginBottom: 2,
  },
  muted: {
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 34,
    right: 34,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#64748b',
    fontSize: 8,
  },
});

const recentExperienceCount = 4;
const olderRoleHighlightCount = 2;

const formatExperienceKey = (exp: ExperienceItem) => `${exp.company}-${exp.title}-${exp.duration}`;

function Footer({ email, pageNumber }: { email: string; pageNumber: number }) {
  return (
    <View style={styles.footer} fixed>
      <Text>CartShift Studio CV</Text>
      <Text>
        Page {pageNumber} of 2 | {email}
      </Text>
    </View>
  );
}

function Header({
  name,
  subtitle,
  location,
  email,
  linkedin,
  github,
}: Pick<CVDocumentProps, 'name' | 'subtitle' | 'location' | 'email' | 'linkedin' | 'github'>) {
  return (
    <View style={styles.header} wrap={false}>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.contactRow}>
        <Text>{location}</Text>
        <Link src={`mailto:${email}`} style={styles.contactLink}>
          {email}
        </Link>
        <Link src={linkedin} style={styles.contactLink}>
          {linkedin}
        </Link>
        <Link src={github} style={styles.contactLink}>
          {github}
        </Link>
      </View>
    </View>
  );
}

function ExperienceSection({
  title,
  experiences,
  compact,
}: {
  title?: string;
  experiences: ExperienceItem[];
  compact?: boolean;
}) {
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {experiences.map(exp => (
        <View key={formatExperienceKey(exp)} style={styles.role} wrap={false}>
          <View style={styles.roleHeader}>
            <View>
              <Text style={styles.roleTitle}>{exp.title}</Text>
              <Text style={styles.company}>
                {exp.company}
                {exp.location ? ` | ${exp.location}` : ''}
              </Text>
            </View>
            <View>
              <Text style={styles.roleMeta}>{exp.duration}</Text>
              <Text style={styles.roleMeta}>{exp.durationYears}</Text>
            </View>
          </View>
          {!compact && exp.description ? (
            <Text style={styles.description}>{exp.description}</Text>
          ) : null}
          {exp.highlights.slice(0, compact ? olderRoleHighlightCount : undefined).map(highlight => (
            <View key={highlight} style={styles.bulletRow}>
              <Text style={styles.bullet}>-</Text>
              <Text style={styles.bulletText}>{highlight}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

export const CVDocument: React.FC<CVDocumentProps> = ({
  name,
  subtitle,
  location,
  email,
  github,
  linkedin,
  summary,
  experiences,
  skills,
  education,
  languages,
}) => (
  <Document title={`${name} - CV`} author={name} subject={subtitle}>
    <Page size="A4" style={styles.page}>
      <Header
        name={name}
        subtitle={subtitle}
        location={location}
        email={email}
        linkedin={linkedin}
        github={github}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      <ExperienceSection
        title="Professional Experience"
        experiences={experiences.slice(0, recentExperienceCount)}
      />

      <Footer email={email} pageNumber={1} />
    </Page>

    <Page size="A4" style={styles.page}>
      <ExperienceSection experiences={experiences.slice(recentExperienceCount)} compact />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technical Skills</Text>
        <View style={styles.skillGrid}>
          {skills.map(group => (
            <View key={group.category} style={styles.skillCard}>
              <Text style={styles.skillTitle}>{group.category}</Text>
              <Text style={styles.skillItems}>{group.items.join(' | ')}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.section, styles.twoCol]}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Education</Text>
          <Text style={styles.smallTitle}>{education.university}</Text>
          <Text>{education.program}</Text>
          <Text style={styles.muted}>{education.years}</Text>
        </View>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Languages</Text>
          {languages.map(language => (
            <Text key={language.name}>
              {language.name}: {language.level}
            </Text>
          ))}
        </View>
      </View>

      <Footer email={email} pageNumber={2} />
    </Page>
  </Document>
);
