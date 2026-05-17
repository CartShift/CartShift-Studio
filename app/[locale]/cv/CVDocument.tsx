'use client';

import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

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
    padding: 34,
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#0f172a',
    lineHeight: 1.35,
  },
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f766e',
    paddingBottom: 14,
    marginBottom: 16,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#020617',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    color: '#475569',
    fontSize: 8.5,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f766e',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 7,
  },
  summary: {
    fontSize: 9.8,
    color: '#1e293b',
  },
  role: {
    marginBottom: 9,
    paddingBottom: 8,
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
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#020617',
  },
  roleMeta: {
    fontSize: 8.5,
    color: '#475569',
    textAlign: 'right',
  },
  company: {
    fontSize: 9.2,
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
    marginBottom: 2.5,
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
    borderRadius: 8,
    padding: 8,
  },
  skillTitle: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#020617',
    marginBottom: 4,
  },
  skillItems: {
    fontSize: 8.5,
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
    fontSize: 10,
    fontWeight: 'bold',
    color: '#020617',
    marginBottom: 2,
  },
  muted: {
    color: '#64748b',
  },
  footer: {
    position: 'absolute',
    bottom: 22,
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
      <View style={styles.header}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.contactRow}>
          <Text>{location}</Text>
          <Text>{email}</Text>
          <Text>{linkedin}</Text>
          <Text>{github}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Summary</Text>
        <Text style={styles.summary}>{summary}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Experience</Text>
        {experiences.map(exp => (
          <View key={`${exp.company}-${exp.duration}`} style={styles.role} wrap={false}>
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
            {exp.description ? <Text style={styles.description}>{exp.description}</Text> : null}
            {exp.highlights.map(highlight => (
              <View key={highlight} style={styles.bulletRow}>
                <Text style={styles.bullet}>-</Text>
                <Text style={styles.bulletText}>{highlight}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

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
          <Text style={styles.muted}>{education.description}</Text>
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

      <View style={styles.footer} fixed>
        <Text>CartShift Studio CV</Text>
        <Text>{email}</Text>
      </View>
    </Page>
  </Document>
);
