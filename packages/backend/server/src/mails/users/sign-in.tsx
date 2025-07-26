import {
  Button,
  Content,
  OnelineCodeBlock,
  P,
  SecondaryText,
  Template,
  Title,
} from '../components';

export type SignInProps = {
  url: string;
  otp: string;
};

export default function SignIn(props: SignInProps) {
  return (
    <Template>
      <Title>Sign in to Open-Agent</Title>
      <Content>
        <P>You are signing in to Open-Agent. Here is your code:</P>
        <OnelineCodeBlock>{props.otp}</OnelineCodeBlock>
        <P>
          Alternatively, you can sign in directly by clicking the magic link
          below:
        </P>
        <Button href={props.url}>Sign in with Magic Link</Button>
        <P>
          <SecondaryText>
            This code and link will expire in 30 minutes.
          </SecondaryText>
        </P>
      </Content>
    </Template>
  );
}

SignIn.PreviewProps = {
  url: 'https://app.open-agent.io/magic-link?token=123456&email=test@test.com',
  otp: '123456',
};
