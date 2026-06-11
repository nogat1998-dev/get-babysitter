@description('Name of the PostgreSQL server')
param name string

@description('Location for the resource')
param location string

@description('Tags for the resource')
param tags object = {}

@description('Administrator login')
param administratorLogin string

@secure()
@description('Administrator password')
param administratorPassword string

@description('Database name')
param databaseName string

resource server 'Microsoft.DBforPostgreSQL/flexibleServers@2023-03-01-preview' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '15'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }

  resource database 'databases' = {
    name: databaseName
    properties: {
      charset: 'UTF8'
      collation: 'en_US.utf8'
    }
  }

  resource postgis 'configurations' = {
    name: 'azure.extensions'
    properties: {
      value: 'POSTGIS'
      source: 'user-override'
    }
  }

  resource firewall 'firewallRules' = {
    name: 'AllowAllAzureServices'
    properties: {
      startIpAddress: '0.0.0.0'
      endIpAddress: '0.0.0.0'
    }
  }
}

output connectionString string = 'postgresql://${administratorLogin}:${administratorPassword}@${server.properties.fullyQualifiedDomainName}:5432/${databaseName}?sslmode=require'
output serverName string = server.name
