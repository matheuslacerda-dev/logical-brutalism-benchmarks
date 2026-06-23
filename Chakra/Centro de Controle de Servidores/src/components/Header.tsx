import { memo } from 'react';
import { Flex, Heading, Text, Badge, HStack, Circle, Box } from '@chakra-ui/react';
import { Activity } from 'lucide-react';

interface HeaderProps {
  lastSync: string;
}

const Header = memo(({ lastSync }: HeaderProps) => {
  return (
    <Flex as="header" justify="space-between" align="center" py={4} mb={6} borderBottomWidth="1px" borderColor="gray.700">
      <HStack spacing={4}>
        <Activity color="#3182ce" size={28} />
        <Box>
          <Heading size="lg" color="white" letterSpacing="tight">
            Centro de Controle de Servidores
          </Heading>
          <Text color="blue.400" fontSize="sm" fontWeight="bold">
            Powered by Chakra UI
          </Text>
        </Box>
      </HStack>

      <HStack spacing={6}>
        <HStack>
          <Circle size="10px" bg="green.400" className="pulse-animation" />
          <Badge colorScheme="green" variant="outline" px={2} py={1}>
            STREAM_ACTIVE
          </Badge>
        </HStack>
        <Text fontSize="sm" color="gray.400" fontFamily="mono">
          Last Sync: {lastSync}
        </Text>
      </HStack>
    </Flex>
  );
});

Header.displayName = 'Header';
export default Header;
