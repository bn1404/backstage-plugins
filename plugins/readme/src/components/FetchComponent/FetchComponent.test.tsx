import mockedEntity from '../../../dev/__fixtures__/entity.json';
import mockedReadmeContent from '../../../dev/__fixtures__/mockedReadmeContent.json';
import { readmeApiRef } from '../../api/ReadmeApi';
import { ReadmeClient } from '../../api/ReadmeClient';
import { FetchComponent } from './FetchComponent';
import { ApiProvider, UrlPatternDiscovery } from '@backstage/core-app-api';
import { IdentityApi, ProfileInfo } from '@backstage/core-plugin-api';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import {
  setupRequestMockHandlers,
  renderInTestApp,
  TestApiRegistry,
  MockFetchApi,
} from '@backstage/test-utils';
import { screen } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import React from 'react';

describe('FetchComponent', () => {
  const server = setupServer();
  setupRequestMockHandlers(server);

  const mockBaseUrl = 'http://localhost:7007/api/readme';
  let readmeClient: ReadmeClient;
  let apis: TestApiRegistry;

  const testProfile: Partial<ProfileInfo> = {
    displayName: 'Display Name',
  };

  const discoveryApi = UrlPatternDiscovery.compile(mockBaseUrl);
  const fetchApi = new MockFetchApi();
  const identityApi: IdentityApi = {
    getBackstageIdentity: async () => ({
      type: 'user',
      userEntityRef: 'user:default/guest',
      ownershipEntityRefs: ['user:default/guest', 'group:default/tools'],
    }),
    getCredentials: async () => ({ token: undefined }),
    getProfileInfo: async () => testProfile,
    signOut: jest.fn(),
  };

  // setup mock response
  beforeEach(() => {
    readmeClient = new ReadmeClient({ discoveryApi, fetchApi, identityApi });
    apis = TestApiRegistry.from([readmeApiRef, readmeClient]);
    server.use(
      rest.get(`${mockBaseUrl}/:entityRef`, (_, res, ctx) =>
        res(ctx.status(200), ctx.json(mockedReadmeContent)),
      ),
    );
  });

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  it('should render content', async () => {
    await renderInTestApp(
      <EntityProvider entity={mockedEntity}>
        <ApiProvider apis={apis}>
          <FetchComponent />,
        </ApiProvider>
      </EntityProvider>,
    );
    expect(screen.getByTestId('readme-content')).toBeInTheDocument();
  });
});
