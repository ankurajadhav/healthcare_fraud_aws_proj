# Architecture
S3 -> Lambda -> DynamoDB -> DynamoDB Streams -> Lambda/EventBridge -> Statistical + Graph Analytics -> Fraud Scoring -> API Gateway -> S3/CloudFront Dashboard

Core analytics: specialty z-score, billing velocity, Tarjan SCC, PageRank, weighted risk score.
