const { mqtt, io, iot } = require('aws-iot-device-sdk-v2');

const CONFIG = {
    endpoint: 'am33kd7s9761h-ats.iot.us-east-1.amazonaws.com',
    key: './config/ec2-private.pem.key',
    cert: './config/ec2-certificate.pem.crt',
    ca_file: './config/AmazonRootCA1.pem',
}

exports.getConnection = function getConnection() {

    var clientID = 'webapp-' + new Date().getTime();

    const client_bootstrap = new io.ClientBootstrap();
    const config_builder = iot.AwsIotMqttConnectionConfigBuilder.new_mtls_builder_from_path(CONFIG.cert, CONFIG.key);
    config_builder.with_certificate_authority_from_path(undefined, CONFIG.ca_file);

    config_builder.with_clean_session(false);
    config_builder.with_client_id(clientID);
    config_builder.with_endpoint(CONFIG.endpoint);

    const config = config_builder.build();
    const client = new mqtt.MqttClient(client_bootstrap);
    const connection = client.new_connection(config);
    return connection;
}