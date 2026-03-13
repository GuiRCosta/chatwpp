import { QueryInterface } from "sequelize"

export default {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addIndex("Tickets", ["tenantId", "lastMessageAt"], {
      name: "idx_tickets_tenant_lastmessageat"
    })

    await queryInterface.addIndex("Tickets", ["tenantId", "userId"], {
      name: "idx_tickets_tenant_userid"
    })

    await queryInterface.addIndex("Tickets", ["tenantId", "queueId"], {
      name: "idx_tickets_tenant_queueid"
    })

    await queryInterface.addIndex("Tickets", ["tenantId", "whatsappId"], {
      name: "idx_tickets_tenant_whatsappid"
    })

    await queryInterface.addIndex("Macros", ["tenantId", "isActive"], {
      name: "idx_macros_tenant_isactive"
    })
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeIndex(
      "Tickets",
      "idx_tickets_tenant_lastmessageat"
    )
    await queryInterface.removeIndex("Tickets", "idx_tickets_tenant_userid")
    await queryInterface.removeIndex("Tickets", "idx_tickets_tenant_queueid")
    await queryInterface.removeIndex("Tickets", "idx_tickets_tenant_whatsappid")
    await queryInterface.removeIndex("Macros", "idx_macros_tenant_isactive")
  }
}
