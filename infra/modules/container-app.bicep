@description('Name of the Container App')
param name string

@description('Location for the resource')
param location string

@description('Tags for the resource')
param tags object = {}

@description('Container Apps environment ID')
param containerAppsEnvironmentId string

@description('Whether the app already exists')
param exists bool = false

@description('Environment variables')
param env array = []

@description('Target port')
param targetPort int = 3001

resource app 'Microsoft.App/containerApps@2023-05-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      ingress: {
        external: true
        targetPort: targetPort
        transport: 'auto'
      }
      registries: []
    }
    template: {
      containers: [
        {
          name: 'main'
          image: exists ? 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest' : 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          env: env
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 3
      }
    }
  }
}

output url string = 'https://${app.properties.configuration.ingress.fqdn}'
output name string = app.name
