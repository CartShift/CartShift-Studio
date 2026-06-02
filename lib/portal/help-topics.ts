import { getPortalPath } from '@/lib/utils/portal-paths';

const CLIENT_TOPIC_PATHS: Record<string, string> = {
  requests: getPortalPath('/requests/'),
  files: getPortalPath('/files/'),
  pricing: getPortalPath('/pricing/'),
  team: getPortalPath('/team/'),
};

const AGENCY_TOPIC_PATHS: Record<string, string> = {
  workboard: getPortalPath('/agency/workboard/'),
  clients: getPortalPath('/agency/clients/'),
  sales: getPortalPath('/agency/sales/'),
  settings: getPortalPath('/agency/settings/'),
};

export function getHelpTopicHref(topicId: string, isAgency: boolean): string | undefined {
  const paths = isAgency ? AGENCY_TOPIC_PATHS : CLIENT_TOPIC_PATHS;
  return paths[topicId];
}

export function getHelpPath(isAgency: boolean): string {
  return getPortalPath(isAgency ? '/agency/help/' : '/help/');
}
