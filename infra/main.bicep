targetScope = 'subscription'

@minLength(1)
@maxLength(64)
@description('Name of the environment')
param environmentName string

@minLength(1)
@description('Primary location for all resources')
param location string

param backendExists bool = false
param frontendExists bool = false

@secure()
param dbPassword string

var abbrs = loadJsonContent('./abbreviations.json')
var tags = { 'azd-env-name': environmentName }
var resourceToken = toLower(uniqueString(subscription().id, environmentName, location))

resource rg 'Microsoft.Resources/resourceGroups@2022-09-01' = {
  name: 'rg-${environmentName}'
  location: location
  tags: tags
}

module db './modules/db.bicep' = {
  name: 'db'
  scope: rg
  params: {
    name: '${abbrs.dbForPostgreSQL}${resourceToken}'
    location: location
    tags: tags
    administratorLogin: 'pgadmin'
    administratorPassword: dbPassword
    databaseName: 'getbabysitter'
  }
}

module containerAppsEnv './modules/container-apps-env.bicep' = {
  name: 'container-apps-env'
  scope: rg
  params: {
    name: '${abbrs.containerAppsEnv}${resourceToken}'
    location: location
    tags: tags
  }
}

module backend './modules/container-app.bicep' = {
  name: 'backend'
  scope: rg
  params: {
    name: '${abbrs.containerApp}backend-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'backend' })
    containerAppsEnvironmentId: containerAppsEnv.outputs.id
    exists: backendExists
    env: [
      { name: 'DATABASE_URL', value: db.outputs.connectionString }
      { name: 'JWT_SECRET', secretRef: 'jwt-secret' }
      { name: 'NODE_ENV', value: 'production' }
    ]
    targetPort: 3001
  }
}

module frontend './modules/container-app.bicep' = {
  name: 'frontend'
  scope: rg
  params: {
    name: '${abbrs.containerApp}frontend-${resourceToken}'
    location: location
    tags: union(tags, { 'azd-service-name': 'frontend' })
    containerAppsEnvironmentId: containerAppsEnv.outputs.id
    exists: frontendExists
    env: [
      { name: 'VITE_API_URL', value: backend.outputs.url }
    ]
    targetPort: 80
  }
}

output BACKEND_URL string = backend.outputs.url
output FRONTEND_URL string = frontend.outputs.url
